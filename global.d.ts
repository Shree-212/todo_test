declare module 'react-native-randombytes' {
    export function randomBytes(size: number, callback: (err: Error | null, buffer: Buffer) => void): void;
}