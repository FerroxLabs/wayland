/** Cloud relay backend - not implemented in Beta. */
export class CloudRelayBackend {
  read(): never {
    throw new Error('Cloud relay sync is not implemented yet.');
  }

  write(_data: Buffer): never {
    throw new Error('Cloud relay sync is not implemented yet.');
  }
}
