//* 
// DN-Node
// 
// Depedency of DN-Node core
// https://github.com/dedestem/DN-Node/Utils.js
// *\\

// Services
import FS from 'fs';

//? Writes JSON to a file
export function WriteJson(File, Json) {
  FS.writeFile(File, JSON.stringify(Json, null, 2), (Err) => {
      if (Err) {
          console.error("Error writing to the " + File, Err);
      }
  });
}

//? Reads JSON from a file (returns a promise)
export function ReadJson(File) {
  return new Promise((resolve, reject) => {
      FS.readFile(File, 'utf8', (Err, data) => {
          if (Err) {
              console.error('Error reading ' + File, Err);
              reject(Err);
          } else {
              try {
                  const jsonData = JSON.parse(data);
                  resolve(jsonData);
              } catch (parseError) {
                  console.error('Error parsing ' + File + '.json:', parseError);
                  reject(parseError);
              }
          }
      });
  });
}
