import Dexie, { type Table } from "dexie"

interface AudioRecord {
  id?: number
  name: string
  blob: Blob
  createdAt: Date
}

class AudioDatabase extends Dexie {
  audios!: Table<AudioRecord, number>

  constructor() {
    super("AudiologyDB")
    this.version(1).stores({
      audios: "++id, name, createdAt",
    })
  }
}

const db = new AudioDatabase()

export const initDB = async () => {
  try {
    await db.open()
    console.log("Database initialized successfully")
    return true
  } catch (error) {
    console.error("Error initializing database:", error)
    return false
  }
}

export const saveAudio = async (name: string, blob: Blob) => {
  try {
    const id = await db.audios.add({
      name,
      blob,
      createdAt: new Date(),
    })
    console.log(`Audio saved with ID: ${id}`)
    return id
  } catch (error) {
    console.error("Error saving audio:", error)
    throw error
  }
}

export const getAllAudios = async () => {
  try {
    const audios = await db.audios.orderBy("createdAt").reverse().toArray()
    return audios.map((audio) => ({
      id: audio.id!,
      name: audio.name,
      blob: audio.blob,
    }))
  } catch (error) {
    console.error("Error getting audios:", error)
    return []
  }
}

export const getAudioById = async (id: number) => {
  try {
    const audio = await db.audios.get(id)
    if (!audio) return null

    return {
      id: audio.id!,
      name: audio.name,
      blob: audio.blob,
    }
  } catch (error) {
    console.error(`Error getting audio with ID ${id}:`, error)
    return null
  }
}

export const deleteAudio = async (id: number) => {
  try {
    await db.audios.delete(id)
    console.log(`Audio with ID ${id} deleted`)
    return true
  } catch (error) {
    console.error(`Error deleting audio with ID ${id}:`, error)
    throw error
  }
}

