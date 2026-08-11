/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TextToSpeechAudio, TextToSpeechConfig } from '@/common/types/ttsTypes';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export class WindowsNativeTtsError extends Error {
  readonly code = 'TTS_WINDOWS_NATIVE_UNAVAILABLE';

  constructor(message: string) {
    super('TTS_WINDOWS_NATIVE_UNAVAILABLE: ' + message);
    this.name = 'WindowsNativeTtsError';
  }
}

/**
 * The synthesizer script, verbatim and constant.
 *
 * Every value that varies per call - the text, the output path, the rate, the
 * voice - arrives as an ENVIRONMENT VARIABLE, read at runtime by PowerShell as
 * data. Nothing the user types is ever concatenated into this string, into the
 * argv, or into a command line. That is the whole design: `Speak("$text")` with
 * an interpolated `$text` is a remote-code-execution primitive the moment a
 * reply contains a backtick or `$(...)`, and the reply is model output.
 *
 * `-EncodedCommand` carries this constant as base64 UTF-16LE, which also sidesteps
 * the execution policy (no .ps1 on disk to be blocked) and every layer of shell
 * quoting between here and PowerShell.
 */
export const WINDOWS_NATIVE_TTS_SCRIPT = [
  "$ErrorActionPreference = 'Stop'",
  'Add-Type -AssemblyName System.Speech',
  '$text = [System.IO.File]::ReadAllText($env:WAYLAND_TTS_TEXT_FILE, [System.Text.Encoding]::UTF8)',
  '$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer',
  'try {',
  '  $synth.Rate = [int]$env:WAYLAND_TTS_RATE',
  '  if ($env:WAYLAND_TTS_VOICE) { $synth.SelectVoice($env:WAYLAND_TTS_VOICE) }',
  '  $synth.SetOutputToWaveFile($env:WAYLAND_TTS_WAV_FILE)',
  '  $synth.Speak($text)',
  '} finally {',
  '  $synth.Dispose()',
  '}',
].join('\n');

/**
 * `System.Speech` rate is an integer in [-10, 10] where 0 is the voice's normal
 * pace; the config speed is a multiplier in [0.5, 2.0] where 1.0 is normal.
 */
export const toWindowsSpeechRate = (speed: number): number => {
  const scaled = Math.round((speed - 1) * 10);
  return Math.min(10, Math.max(-10, Number.isFinite(scaled) ? scaled : 0));
};

/** Constant argv. Contains no call-varying data by construction. */
export const buildWindowsNativeSpeechArgs = (): string[] => [
  '-NoProfile',
  '-NonInteractive',
  '-EncodedCommand',
  Buffer.from(WINDOWS_NATIVE_TTS_SCRIPT, 'utf16le').toString('base64'),
];

/**
 * Absolute path to the in-box PowerShell, so a `powershell.exe` planted earlier
 * on PATH cannot be the thing we execute.
 */
export const resolvePowerShellPath = (systemRoot?: string): string =>
  path.join(systemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');

/** Injectable seam so the JS half is testable off Windows. */
export type WindowsNativeTtsRuntime = {
  /** Run PowerShell with the given argv and environment. */
  run: (executable: string, args: string[], env: NodeJS.ProcessEnv) => Promise<void>;
};

export const defaultWindowsNativeTtsRuntime: WindowsNativeTtsRuntime = {
  run: async (executable, args, env) => {
    await execFileAsync(executable, args, { env, encoding: 'buffer', maxBuffer: 1024 * 1024, windowsHide: true });
  },
};

/** A WAV that Chromium will decode starts `RIFF....WAVE`. */
const isRiffWave = (bytes: Uint8Array): boolean =>
  bytes.length >= 12 &&
  bytes[0] === 0x52 &&
  bytes[1] === 0x49 &&
  bytes[2] === 0x46 &&
  bytes[3] === 0x46 &&
  bytes[8] === 0x57 &&
  bytes[9] === 0x41 &&
  bytes[10] === 0x56 &&
  bytes[11] === 0x45;

/**
 * Windows speech-out floor: System.Speech via PowerShell, no key, no download,
 * no network. Symmetric with the macOS `say` branch.
 *
 * The RIFF check at the end is not defensive padding. A synthesizer that writes
 * an empty file and exits 0 hands the renderer a buffer whose `<audio>` element
 * never fires `ended`, which is indistinguishable from a broken microphone and
 * is exactly the failure mode this lane exists to remove. An unusable result
 * must arrive as a named error, not as silence.
 */
export const synthesizeWindowsNative = async (
  text: string,
  config: TextToSpeechConfig,
  runtime: WindowsNativeTtsRuntime = defaultWindowsNativeTtsRuntime
): Promise<TextToSpeechAudio> => {
  if (process.platform !== 'win32') {
    throw new WindowsNativeTtsError('Windows speech is available only on Windows');
  }

  const directory = await mkdtemp(path.join(tmpdir(), 'wayland-tts-'));
  const textFile = path.join(directory, 'input.txt');
  const wavFile = path.join(directory, 'speech.wav');
  try {
    await writeFile(textFile, text, 'utf8');
    await runtime.run(resolvePowerShellPath(process.env.SystemRoot), buildWindowsNativeSpeechArgs(), {
      ...process.env,
      WAYLAND_TTS_TEXT_FILE: textFile,
      WAYLAND_TTS_WAV_FILE: wavFile,
      WAYLAND_TTS_RATE: String(toWindowsSpeechRate(config.speed)),
      WAYLAND_TTS_VOICE: config.voice && config.voice !== 'default' ? config.voice : '',
    });

    const data = new Uint8Array(await readFile(wavFile));
    if (!isRiffWave(data)) {
      throw new WindowsNativeTtsError(
        data.length === 0
          ? 'the Windows synthesizer produced no audio'
          : 'the Windows synthesizer produced audio that is not a RIFF/WAVE file'
      );
    }
    return { data, mimeType: 'audio/wav' };
  } catch (error) {
    if (error instanceof WindowsNativeTtsError) throw error;
    throw new WindowsNativeTtsError(error instanceof Error ? error.message : String(error));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
};
