# Third-Party Notices

This document records the upstream codebases that the Wayland desktop app
inherits from and the licenses that govern those contributions. It satisfies
the attribution requirements of the Apache License, Version 2.0 for derivative
works.

The Wayland desktop app (this repository) is © 2026 Ferrox Labs and is
distributed under the Apache License, Version 2.0. See [`/LICENSE`](../../LICENSE)
for the full license text.

The current codebase has been substantively modified from its upstream and
constitutes a new work for copyright purposes. The notices below preserve the
original copyright statements as required by the Apache License.

## AionUi

Portions of this codebase derive from AionUi
(<https://github.com/iOfficeAI/AionUi>), an open-source chat application
originally published by AionUi.

> Copyright 2025 AionUi (aionui.com)
>
> Licensed under the Apache License, Version 2.0 (the "License"); you may not
> use this file except in compliance with the License. You may obtain a copy of
> the License at
>
> <http://www.apache.org/licenses/LICENSE-2.0>
>
> Unless required by applicable law or agreed to in writing, software
> distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
> WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
> License for the specific language governing permissions and limitations
> under the License.

Wayland's Rust engine (`wayland-core`) is a separate fork of `iOfficeAI/aionrs`
maintained in its own repository under the same Apache License, Version 2.0.

## OpenClaw

The channels subsystem (`src/process/services/channels/...` and related code)
incorporates work derived from OpenClaw, licensed under the MIT License. See
the per-file headers under that subtree for original copyright statements.
