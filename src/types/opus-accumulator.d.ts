declare module "opus-accumulator" {
    export function concatChunks(chunks: Uint8Array[]): Promise<Uint8Array>
}
