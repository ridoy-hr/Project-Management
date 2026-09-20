import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Project, Task, AIMemoryNote } from '../types';
import { projects as defaultProjects, initialTasks, initialMemories } from '../data';
import { useStore } from '../store';

let isInitialized = false;
let isRemoteUpdate = false;

/**
 * Strips undefined values recursively because Firestore throws an error if any field is undefined.
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => cleanForFirestore(item)) as any;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned as any;
  }
  return data;
}

export async function initFirebaseSync() {
  if (isInitialized) return;

  try {
    // 1. Check if projects exist in Firestore. If completely empty, seed initial data.
    const projectsSnap = await getDocs(collection(db, 'projects')).catch(err => {
      handleFirestoreError(err, OperationType.GET, 'projects');
      return null;
    });

    if (projectsSnap && projectsSnap.empty) {
      console.log('Seeding initial workspace data to Firebase Firestore...');
      const batch = writeBatch(db);

      // Seed default projects
      defaultProjects.forEach(proj => {
        const ref = doc(db, 'projects', proj.id);
        batch.set(ref, cleanForFirestore({
          ...proj,
          updatedAt: new Date().toISOString()
        }));
      });

      // Seed default tasks
      initialTasks.forEach(task => {
        const ref = doc(db, 'tasks', task.id);
        batch.set(ref, cleanForFirestore({
          ...task,
          updatedAt: new Date().toISOString()
        }));
      });

      // Seed default memories
      initialMemories.forEach(mem => {
        const ref = doc(db, 'memories', mem.id);
        batch.set(ref, cleanForFirestore({
          ...mem,
          updatedAt: new Date().toISOString()
        }));
      });

      await batch.commit().catch(err => {
        handleFirestoreError(err, OperationType.WRITE, 'batch_seed');
      });
    }

    // Mark initialized only after successful setup or if documents already exist
    isInitialized = true;

    // 2. Set up real-time listener for Projects
    onSnapshot(collection(db, 'projects'), (snap) => {
      if (!snap.empty) {
        const remoteProjects: Project[] = [];
        snap.forEach(d => {
          remoteProjects.push(d.data() as Project);
        });
        
        isRemoteUpdate = true;
        useStore.setState(() => ({
          projects: remoteProjects
        }));
        isRemoteUpdate = false;
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'projects');
    });

    // 3. Set up real-time listener for Tasks
    onSnapshot(collection(db, 'tasks'), (snap) => {
      if (!snap.empty) {
        const remoteTasks: Task[] = [];
        snap.forEach(d => {
          remoteTasks.push(d.data() as Task);
        });
        
        isRemoteUpdate = true;
        useStore.setState(() => ({
          tasks: remoteTasks
        }));
        isRemoteUpdate = false;
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'tasks');
    });

    // 4. Set up real-time listener for Memories
    onSnapshot(collection(db, 'memories'), (snap) => {
      if (!snap.empty) {
        const remoteMemories: AIMemoryNote[] = [];
        snap.forEach(d => {
          remoteMemories.push(d.data() as AIMemoryNote);
        });
        
        isRemoteUpdate = true;
        useStore.setState(() => ({
          memories: remoteMemories
        }));
        isRemoteUpdate = false;
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'memories');
    });

  } catch (err) {
    console.error('Error during initFirebaseSync:', err);
  }
}

// Helper methods to write directly to Firestore
export async function syncProjectToFirebase(project: Project) {
  if (isRemoteUpdate) return;
  try {
    await setDoc(doc(db, 'projects', project.id), cleanForFirestore({
      ...project,
      updatedAt: new Date().toISOString()
    }), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `projects/${project.id}`);
  }
}

export async function deleteProjectFromFirebase(projectId: string) {
  if (isRemoteUpdate) return;
  try {
    await deleteDoc(doc(db, 'projects', projectId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `projects/${projectId}`);
  }
}

export async function syncTaskToFirebase(task: Task) {
  if (isRemoteUpdate) return;
  try {
    await setDoc(doc(db, 'tasks', task.id), cleanForFirestore({
      ...task,
      updatedAt: new Date().toISOString()
    }), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `tasks/${task.id}`);
  }
}

export async function syncTasksBatchToFirebase(tasksToSync: Task[]) {
  if (isRemoteUpdate || !tasksToSync || tasksToSync.length === 0) return;
  try {
    // Firestore writeBatch max is 500 operations per batch
    const CHUNK_SIZE = 400;
    for (let i = 0; i < tasksToSync.length; i += CHUNK_SIZE) {
      const chunk = tasksToSync.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach(task => {
        const ref = doc(db, 'tasks', task.id);
        batch.set(ref, cleanForFirestore({
          ...task,
          updatedAt: new Date().toISOString()
        }), { merge: true });
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'tasks/batch');
  }
}

export async function deleteTaskFromFirebase(taskId: string) {
  if (isRemoteUpdate) return;
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `tasks/${taskId}`);
  }
}

export async function syncMemoryToFirebase(memory: AIMemoryNote) {
  if (isRemoteUpdate) return;
  try {
    await setDoc(doc(db, 'memories', memory.id), cleanForFirestore({
      ...memory,
      updatedAt: new Date().toISOString()
    }), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `memories/${memory.id}`);
  }
}

export async function deleteMemoryFromFirebase(memoryId: string) {
  if (isRemoteUpdate) return;
  try {
    await deleteDoc(doc(db, 'memories', memoryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `memories/${memoryId}`);
  }
}
