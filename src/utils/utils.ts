export const convertFileToUint8Array = (file: File): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const arrayBuffer = reader.result as ArrayBuffer;
            const uint8Array = new Uint8Array(arrayBuffer);
            resolve(uint8Array);
        };

        reader.onerror = () => {
            reject("Error reading file");
        };

        reader.readAsArrayBuffer(file);
    });
};
