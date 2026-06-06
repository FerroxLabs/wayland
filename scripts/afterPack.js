const { Arch } = require('builder-util');
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  normalizeArch,
  rebuildSingleModule,
  verifyModuleBinary,
  getModulesToRebuild,
} = require('./rebuildNativeModules');

/**
 * Resolve the path passed to @electron/fuses' flipFuses for the current target.
 * - macOS: the .app bundle (flipFuses locates the Electron framework binary inside)
 * - Windows: the top-level <productFilename>.exe
 * - Linux: the lowercase executable produced from executableName/productFilename
 */
function resolveFuseTarget(electronPlatformName, appOutDir, packager) {
  const productFilename = packager?.appInfo?.productFilename || 'Wayland';
  if (electronPlatformName === 'darwin' || electronPlatformName === 'mas') {
    return path.join(appOutDir, `${productFilename}.app`);
  }
  if (electronPlatformName === 'win32') {
    return path.join(appOutDir, `${productFilename}.exe`);
  }
  // Linux: electron-builder exposes the final (sanitized) executable filename on the
  // packager. It only lowercases when no executableName is configured, so don't force
  // lowercase here - fall back to the lowercased sanitizedName only when unavailable.
  const executableName = packager?.executableName || packager?.appInfo?.sanitizedName?.toLowerCase() || productFilename;
  return path.join(appOutDir, executableName);
}

/**
 * Apply Electron fuses to the packaged binary (SEC-ELEC-05).
 * Disables Node-as-host attack surface (RunAsNode / NODE_OPTIONS / --inspect) and
 * enforces asar-only loading + embedded asar integrity validation.
 *
 * On macOS this must run before code signing (afterSign) so the signature covers the
 * fused binary; flipping fuses invalidates any existing (ad-hoc) signature, so we
 * reset an ad-hoc signature here to keep afterSign's `codesign --verify` happy before
 * real signing/notarization replaces it.
 */
async function applyElectronFuses(context) {
  const { electronPlatformName, appOutDir, packager } = context;

  // @electron/fuses is ESM-only.
  const { flipFuses, FuseVersion, FuseV1Options } = await import('@electron/fuses');

  const target = resolveFuseTarget(electronPlatformName, appOutDir, packager);
  if (!fs.existsSync(target)) {
    throw new Error(`Cannot apply Electron fuses: binary not found at ${target}`);
  }

  const isDarwin = electronPlatformName === 'darwin' || electronPlatformName === 'mas';

  console.log(`\n🔒 Applying Electron fuses to ${target}`);
  await flipFuses(target, {
    version: FuseVersion.V1,
    // Re-sign ad-hoc on macOS since flipping fuses invalidates the existing signature.
    resetAdHocDarwinSignature: isDarwin,
    [FuseV1Options.RunAsNode]: false,
    [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
    [FuseV1Options.EnableNodeCliInspectArguments]: false,
    [FuseV1Options.OnlyLoadAppFromAsar]: true,
    [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
  });
  console.log(`   ✓ Fuses applied (RunAsNode/NODE_OPTIONS/inspect disabled, asar-only enforced)`);
}

/**
 * afterPack hook for electron-builder
 * Applies Electron fuses, then rebuilds native modules for cross-architecture builds.
 */

module.exports = async function afterPack(context) {
  const { arch, electronPlatformName, appOutDir, packager } = context;

  // Harden the packaged binary before anything else (notably before afterSign on macOS).
  await applyElectronFuses(context);
  const targetArch = normalizeArch(typeof arch === 'string' ? arch : Arch[arch] || process.arch);
  const buildArch = normalizeArch(os.arch());

  console.log(`\n🔧 afterPack hook started`);
  console.log(`   Platform: ${electronPlatformName}, Build arch: ${buildArch}, Target arch: ${targetArch}`);

  const isCrossCompile = buildArch !== targetArch;
  const forceRebuild = process.env.FORCE_NATIVE_REBUILD === 'true';
  const needsSameArchRebuild = electronPlatformName === 'win32'; // Only Windows needs same-arch rebuild to match Electron ABI
  // Linux uses prebuilt binaries to avoid GLIBC version dependencies

  if (!isCrossCompile && !needsSameArchRebuild && !forceRebuild) {
    console.log(`   ✓ Same architecture, rebuild skipped (set FORCE_NATIVE_REBUILD=true to override)\n`);
    return;
  }

  // Note: Previously there was an optimization to skip macOS cross-compilation,
  // but this caused incorrect architecture binaries (arm64) to be included in x64 builds.
  // Now we always rebuild native modules for cross-compilation to ensure correctness.
  // The rebuild process uses prebuild-install first (fast), falling back to source compilation only when needed.

  if (isCrossCompile) {
    console.log(`   ⚠️  Cross-compilation detected (${buildArch} → ${targetArch}), will rebuild native modules`);
    if (electronPlatformName === 'darwin') {
      console.log(`   💡 Using prebuild-install for faster cross-architecture build`);
    }
  } else if (needsSameArchRebuild || forceRebuild) {
    console.log(`   ℹ️  Rebuilding native modules for platform requirements (force=${forceRebuild})`);
  }

  console.log(`\n🔧 Checking native modules (${electronPlatformName}-${targetArch})...`);
  console.log(`   appOutDir: ${appOutDir}`);

  const electronVersion =
    packager?.info?.electronVersion ??
    packager?.config?.electronVersion ??
    require('../package.json').devDependencies?.electron?.replace(/^\D*/, '');

  // Determine resources directory based on platform
  // macOS: appOutDir/Wayland.app/Contents/Resources
  // Windows/Linux: appOutDir/resources
  let resourcesDir;
  if (electronPlatformName === 'darwin') {
    const appName = packager?.appInfo?.productFilename || 'Wayland';
    resourcesDir = path.join(appOutDir, `${appName}.app`, 'Contents', 'Resources');
  } else {
    resourcesDir = path.join(appOutDir, 'resources');
  }

  // Debug: check what's in resources directory
  console.log(`   Checking resources directory: ${resourcesDir}`);
  if (fs.existsSync(resourcesDir)) {
    const resourcesContents = fs.readdirSync(resourcesDir);
    console.log(`   Contents: ${resourcesContents.join(', ')}`);

    // Check if app.asar.unpacked exists
    const unpackedDir = path.join(resourcesDir, 'app.asar.unpacked');
    if (fs.existsSync(unpackedDir)) {
      const unpackedContents = fs.readdirSync(unpackedDir);
      console.log(`   app.asar.unpacked contents: ${unpackedContents.join(', ')}`);

      // Check node_modules
      const nodeModulesDir = path.join(unpackedDir, 'node_modules');
      if (fs.existsSync(nodeModulesDir)) {
        const modulesContents = fs.readdirSync(nodeModulesDir);
        console.log(`   node_modules contents: ${modulesContents.slice(0, 10).join(', ')}...`);
      } else {
        console.warn(`   ⚠️  node_modules not found in app.asar.unpacked`);
      }
    } else {
      console.warn(`   ⚠️  app.asar.unpacked not found`);
    }
  } else {
    console.warn(`⚠️  resources directory not found: ${resourcesDir}`);
    return;
  }

  const nodeModulesDir = path.join(resourcesDir, 'app.asar.unpacked', 'node_modules');

  // Modules that need to be rebuilt for cross-compilation
  // Use platform-specific module list (Windows skips node-pty due to cross-compilation issues)
  const modulesToRebuild = getModulesToRebuild(electronPlatformName);
  console.log(`   Modules to rebuild: ${modulesToRebuild.join(', ')}`);

  // For cross-compilation, clean up build artifacts from the wrong architecture
  // This prevents node-gyp-build from loading incorrect binaries
  if (isCrossCompile) {
    console.log(`\n🧹 Cleaning up wrong-architecture build artifacts...`);
    for (const moduleName of modulesToRebuild) {
      const moduleRoot = path.join(nodeModulesDir, moduleName);
      if (!fs.existsSync(moduleRoot)) continue;

      // Remove build/ directory (contains wrong-arch compiled binaries)
      const buildDir = path.join(moduleRoot, 'build');
      if (fs.existsSync(buildDir)) {
        fs.rmSync(buildDir, { recursive: true, force: true });
        console.log(`   ✓ Removed ${moduleName}/build/`);
      }

      // Remove bin/ directory (might contain wrong-arch binaries)
      const binDir = path.join(moduleRoot, 'bin');
      if (fs.existsSync(binDir)) {
        fs.rmSync(binDir, { recursive: true, force: true });
        console.log(`   ✓ Removed ${moduleName}/bin/`);
      }
    }

    // Also clean up architecture-specific packages that shouldn't be included
    // Remove packages for the opposite architecture of the target
    const wrongArchSuffix = targetArch === 'arm64' ? 'x64' : 'arm64';
    console.log(`\n🧹 Removing ${wrongArchSuffix}-specific optional dependencies (target: ${targetArch})...`);

    if (fs.existsSync(nodeModulesDir)) {
      const allModules = fs.readdirSync(nodeModulesDir);
      for (const module of allModules) {
        const modulePath = path.join(nodeModulesDir, module);

        // Handle scoped packages (e.g., @lydell, @napi-rs)
        if (module.startsWith('@') && fs.existsSync(modulePath) && fs.statSync(modulePath).isDirectory()) {
          const scopedPackages = fs.readdirSync(modulePath);
          for (const pkg of scopedPackages) {
            if (pkg.includes(`-${wrongArchSuffix}`) || pkg.includes(`-${electronPlatformName}-${wrongArchSuffix}`)) {
              const pkgPath = path.join(modulePath, pkg);
              if (fs.existsSync(pkgPath) && fs.statSync(pkgPath).isDirectory()) {
                fs.rmSync(pkgPath, { recursive: true, force: true });
                console.log(`   ✓ Removed ${module}/${pkg}`);
              }
            }
          }
        }
        // Handle regular packages
        else if (
          module.includes(`-${wrongArchSuffix}`) ||
          module.includes(`-${electronPlatformName}-${wrongArchSuffix}`)
        ) {
          if (fs.existsSync(modulePath) && fs.statSync(modulePath).isDirectory()) {
            fs.rmSync(modulePath, { recursive: true, force: true });
            console.log(`   ✓ Removed ${module}`);
          }
        }
      }
    }
  }

  const failedModules = [];

  for (const moduleName of modulesToRebuild) {
    const moduleRoot = path.join(nodeModulesDir, moduleName);

    if (!fs.existsSync(moduleRoot)) {
      console.warn(`   ⚠️  ${moduleName} not found, skipping`);
      continue;
    }

    console.log(`   ✓ Found ${moduleName}, rebuilding for ${targetArch}...`);

    // For Windows, prefer prebuild-install first (faster and more reliable in CI)
    // electron-rebuild can hang on "Searching dependency tree" in some CI environments
    // prebuild-install will fall back to electron-rebuild internally if no prebuilt binary exists
    const forceRebuildFromSource = false; // Always try prebuild-install first

    const success = rebuildSingleModule({
      moduleName,
      moduleRoot,
      platform: electronPlatformName,
      arch: targetArch,
      electronVersion,
      projectRoot: path.resolve(__dirname, '..'),
      buildArch: buildArch, // Pass build architecture for cross-compile detection
      forceRebuild: forceRebuildFromSource, // Always try prebuild-install first, fallback to rebuild
    });

    if (success) {
      console.log(`     ✓ Rebuild completed`);
    } else {
      console.error(`     ✗ Rebuild failed`);
      failedModules.push(moduleName);
      continue;
    }

    const verified = verifyModuleBinary(moduleRoot, moduleName);
    if (verified) {
      console.log(`     ✓ Binary verification passed`);
    } else {
      console.error(`     ✗ Binary verification failed`);
      failedModules.push(moduleName);
    }

    console.log(''); // Empty line between modules
  }

  if (failedModules.length > 0) {
    throw new Error(`Failed to rebuild modules for ${electronPlatformName}-${targetArch}: ${failedModules.join(', ')}`);
  }

  console.log(`✅ All native modules rebuilt successfully for ${targetArch}\n`);
};
