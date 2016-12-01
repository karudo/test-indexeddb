const logObjectStoreName = 'log2';


let instance;

function getInstance() {
  return new Promise((resolve, reject) => {
    if (instance) {
      resolve(instance);
    }
    else {
      const request = indexedDB.open('PUSHWOOSH_SDK_STORE', 7);
      request.onsuccess = (event) => {
        const database = event.target.result;
        if (instance) {
          database.close();
          resolve(instance);
        }
        else {
          instance = database;
          resolve(database);
        }
      };
      request.onerror = (event) => {
        reject(event);
      };
      request.onupgradeneeded = (event) => {
        const database = event.target.result;
        if (!database.objectStoreNames.contains('keyValue')) {
          database.createObjectStore('keyValue', {
            keyPath: 'key'
          });
        }
        if (!database.objectStoreNames.contains(logObjectStoreName)) {
          const logStore = database.createObjectStore(logObjectStoreName, {
            keyPath: 'id',
            autoIncrement: true
          });
          logStore.createIndex("date", "date", { unique: false });
          logStore.createIndex("type", "type", { unique: false });
        }
      };
      request.onversionchange = (event) => {
        console.info('The database is about to be deleted.', event); // eslint-disable-line
      };
    }
  });
}

function createLog(name = logObjectStoreName) {
  return {
    add(type, message) {
      return getInstance().then(database => {
        return new Promise((resolve, reject) => {
          const obj = {
            type,
            date: new Date(),
            message,
          };
          const request = database.transaction([name], 'readwrite').objectStore(name).add(obj);
          request.onsuccess = () => {
            resolve(obj);
          };
          request.onerror = (e) => {
            reject(e);
          };
        });
      });
    },
    getAll() {
      return getInstance().then(database => {
        return new Promise((resolve, reject) => {
          const request = database.transaction(name).objectStore(name).getAll();
          request.onsuccess = () => {
            const {result} = request;
            console.table(result);
            resolve(result);
          };
          request.onerror = () => {
            reject(request.errorCode);
          };
        });
      });
    }
  };
}

function createKeyValue(name) {
  return {
    get(key) {
      return getInstance().then(database => {
        return new Promise((resolve, reject) => {
          const request = database.transaction(name).objectStore(name).get(key);
          request.onsuccess = () => {
            const {result} = request;
            resolve(result && result.value);
          };
          request.onerror = () => {
            reject(request.errorCode);
          };
        });
      });
    },

    ga2() {
      return getInstance().then(database => {
        return new Promise((resolve, reject) => {
          const request = database.transaction(name).objectStore(name).getAll();
          request.onsuccess = () => {
            const {result} = request;
            console.log(result.reduce((acc, obj) => {
              acc[obj.key] = obj.value;
              return acc;
            }, {}));
            resolve(result && result.value);
          };
          request.onerror = () => {
            reject(request.errorCode);
          };
        });
      });
    },

    getAll() {
      return getInstance().then(database => {
        return new Promise((resolve, reject) => {
          const result = {};
          const cursor = database.transaction(name).objectStore(name).openCursor();
          cursor.onsuccess = (event) => {
            const cursorResult = event.target.result;
            if (cursorResult) {
              result[cursorResult.key] = cursorResult.value.value;
              cursorResult.continue();
            }
            else {
              resolve(result);
            }
          };
          cursor.onerror = () => {
            reject(cursor.errorCode);
          };
        });
      });
    },

    set(key, value) {
      return getInstance().then(database => {
        return new Promise((resolve, reject) => {
          const request = database.transaction([name], 'readwrite').objectStore(name).put({key, value});
          request.onsuccess = () => {
            resolve(key);
          };
          request.onerror = (e) => {
            reject(e);
          };
        });
      });
    }
  };
}

export const keyValue = createKeyValue('keyValue');
export const log = createLog();
