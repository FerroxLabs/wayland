"""Kokoro warm worker: loads the model once, serves JSON-lines requests.
stdin:  {"id": "r1", "text": "...", "voice": "af_sky", "speed": 1.0}
stdout: {"id": "r1", "seq": 0, "pcm_b64": "...", "sample_rate": 24000, "final": false}
        ... one line per sentence chunk, last has final=true ...
stderr: human-readable logs only. Exits on stdin EOF."""
import base64, json, re, sys

from kokoro_onnx import Kokoro
import numpy as np

model_path, voices_path = sys.argv[1], sys.argv[2]
kokoro = Kokoro(model_path, voices_path)
print(json.dumps({"ready": True}), flush=True)

SENTENCE_SPLIT = re.compile(r'(?<=[.!?])\s+')

def pcm16(samples):
    return (np.clip(samples, -1.0, 1.0) * 32767).astype('<i2').tobytes()

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        req = json.loads(line)
        sentences = [s for s in SENTENCE_SPLIT.split(req["text"].strip()) if s] or [req["text"]]
        for i, sentence in enumerate(sentences):
            samples, sr = kokoro.create(sentence, voice=req.get("voice") or "af_sky",
                                        speed=float(req.get("speed") or 1.0))
            print(json.dumps({"id": req["id"], "seq": i, "pcm_b64": base64.b64encode(pcm16(samples)).decode(),
                              "sample_rate": sr, "final": i == len(sentences) - 1}), flush=True)
    except Exception as exc:  # noqa: BLE001 - report per-request, keep serving
        print(json.dumps({"id": req.get("id", "?") if isinstance(req, dict) else "?",
                          "error": str(exc), "final": True}), flush=True)
