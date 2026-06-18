"""Piper warm worker: loads voices on demand, caches them, serves JSON-lines requests.
Piper's multilingual voices are SEPARATE model files, so the model path arrives
per-request and loaded PiperVoice objects are cached keyed by model path.
stdin:  {"id": "r1", "model": "/abs/path.onnx", "text": "...", "length_scale": 1.0}
stdout: {"id": "r1", "seq": 0, "pcm_b64": "...", "sample_rate": 22050, "final": false}
        ... one line per AudioChunk (sentence), last has final=true ...
stderr: human-readable logs only. Exits on stdin EOF."""
import base64, json, sys

from piper import PiperVoice, SynthesisConfig

voices = {}
print(json.dumps({"ready": True}), flush=True)

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    req = None
    try:
        req = json.loads(line)
        model = req["model"]
        v = voices.get(model) or voices.setdefault(model, PiperVoice.load(model))
        cfg = SynthesisConfig(length_scale=float(req.get("length_scale") or 1.0))
        chunks = list(v.synthesize(req["text"], cfg))
        if not chunks:
            print(json.dumps({"id": req["id"], "seq": 0, "pcm_b64": "",
                              "sample_rate": 22050, "final": True}), flush=True)
            continue
        last = len(chunks) - 1
        for i, c in enumerate(chunks):
            print(json.dumps({"id": req["id"], "seq": i,
                              "pcm_b64": base64.b64encode(c.audio_int16_bytes).decode(),
                              "sample_rate": c.sample_rate, "final": i == last}), flush=True)
    except Exception as exc:  # noqa: BLE001 - report per-request, keep serving
        print(json.dumps({"id": req.get("id", "?") if isinstance(req, dict) else "?",
                          "error": str(exc), "final": True}), flush=True)
