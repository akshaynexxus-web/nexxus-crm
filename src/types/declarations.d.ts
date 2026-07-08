/// <reference types="vite/client" />

declare module 'bcryptjs' {
  export function hash(password: string, saltRounds: number): Promise<string>
  export function compare(password: string, hash: string): Promise<boolean>
}

declare module 'uuid' {
  export function v4(): string
}
