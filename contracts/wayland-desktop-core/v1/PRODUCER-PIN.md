# Desktop validation pin

This corpus is a byte-for-byte mechanical import from Wayland Core commit
`d0aa0abc75afe056cc5434fcd652efa6d474ab0c`.

- contract: `wayland-desktop-core` `1.0`
- generator: `wcore-desktop-contract-gen/1`
- fixtures: `sha256:2c611ffad0096289fc6a68e93921233821b9d75028b21b9a85c67b293eadac2b`
- schemas: `sha256:37c51099256e62226306fa02f7a8637cc6a9a102df8e7c41c6e73253f7638271`
- source inputs: `sha256:c3fb582801bbf7ab75a9fefe45e79e5cafb28013bc900a6515cfd7462650863e`

The exact producer commit is now published and immutable at
`FerroxLabs/wayland-core` branch `origin/feat/887`. This file is contract
authority for Desktop's v1 consumer. It does not by itself change the packaged
Wayland Core binary, which remains released `v0.12.25` until a separately
authorized binary/release uptake passes the release compatibility matrix.
