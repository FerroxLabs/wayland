const { execSync } = require('child_process');
const path = require('path');

exports.default = async function afterSign(context) {
  const { electronPlatformName, appOutDir } = context;

  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;

  // Check if app is actually signed before attempting notarization
  try {
    execSync(`codesign --verify --verbose "${appPath}"`, { stdio: 'pipe' });
    console.log(`App ${appName} is properly code signed`);
  } catch (error) {
    console.log(`App ${appName} is not code signed, applying ad-hoc signature...`);
    try {
      execSync(`codesign --force --deep --sign - "${appPath}"`, { stdio: 'inherit' });
      console.log(`Ad-hoc signature applied successfully to ${appName}`);
    } catch (adHocError) {
      console.error('Ad-hoc signing failed:', adHocError.message);
    }
    return;
  }

  // Skip notarization if credentials are not provided
  const appleId = process.env.appleId;
  const appleIdPassword = process.env.appleIdPassword;
  const teamId = process.env.teamId;
  if (!appleId || !appleIdPassword || !teamId) {
    console.log('Skipping notarization - missing Apple ID credentials');
    return;
  }

  console.log(`Starting notarization for ${appName}...`);

  // We notarize via `xcrun notarytool` DIRECTLY instead of @electron/notarize so
  // we can pass `--timeout`. notarytool's `--wait` blocks until Apple finishes;
  // `--timeout` makes notarytool ITSELF give up and exit cleanly when Apple's
  // queue stalls. That matters because a JS-level timeout (Promise.race) only
  // stops *awaiting* - it can't kill the spawned notarytool process, which then
  // keeps the build's Node process alive and hangs the whole release (observed:
  // a release job stuck for hours on Apple's queue). Letting notarytool own the
  // timeout means the child always exits.
  //
  // Any failure/timeout is non-fatal on purpose: the app stays Developer-ID
  // signed (just not stapled), which installs with a one-time Gatekeeper prompt
  // and can be re-released to staple once Apple's notary service recovers.
  const zipPath = path.join(appOutDir, `${appName}-notarize.zip`);
  try {
    // notarytool requires an archive (zip/pkg/dmg), not a raw .app bundle.
    execSync(`ditto -c -k --keepParent "${appPath}" "${zipPath}"`, { stdio: 'inherit' });

    // Pass the password through the environment ($NOTARYTOOL_PWD) so it never
    // appears in this script's command string or logs.
    const submitCmd = [
      'xcrun notarytool submit',
      `"${zipPath}"`,
      `--apple-id "${appleId}"`,
      `--team-id "${teamId}"`,
      '--password "$NOTARYTOOL_PWD"',
      '--wait',
      '--timeout 20m',
    ].join(' ');
    execSync(submitCmd, {
      stdio: 'inherit',
      env: { ...process.env, NOTARYTOOL_PWD: appleIdPassword },
    });

    // Staple the ticket to the .app so Gatekeeper validates offline.
    execSync(`xcrun stapler staple "${appPath}"`, { stdio: 'inherit' });
    console.log('Notarization + stapling completed successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`::warning title=Notarization not completed::${message}`);
    console.warn(
      `⚠️ Continuing with a signed-but-unstapled build for ${appName}. Re-release to staple once Apple's notary service recovers.`
    );
  } finally {
    try {
      execSync(`rm -f "${zipPath}"`);
    } catch {
      // best-effort cleanup
    }
  }
};
