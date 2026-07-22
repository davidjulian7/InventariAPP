import { localStorageAdapter, seedLocalDb, clearLocalDb } from './db'

seedLocalDb()

export const db = localStorageAdapter

export { seedLocalDb, clearLocalDb }
