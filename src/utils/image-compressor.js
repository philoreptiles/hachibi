export function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
        // Formatos que ningún <img> de navegador puede decodificar de forma
        // confiable (ni siquiera Safari en su propio dispositivo, fuera de
        // apps nativas de Apple) -- si el archivo ya viene así, ni vale la
        // pena intentar dibujarlo en el canvas: img.onload nunca dispara,
        // solo se pierde tiempo hasta que finalmente cae en img.onerror.
        // En la práctica el picker nativo de iOS ya convierte HEIC/HEIF a
        // JPEG antes de entregarle el archivo a la página en la mayoría de
        // los casos, pero no siempre (por ejemplo, si se comparte el
        // archivo directo desde la app Archivos).
        if (/^image\/hei[cf]/i.test(file.type)) {
            reject(new Error('Formato HEIC/HEIF no soportado para comprimir en el navegador.'));
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // CAMBIO: JPEG en vez de WebP. WebP pesaba menos, pero
                // Safari (Mac y sobre todo iOS) no soporta de forma
                // confiable CODIFICAR WebP desde canvas.toBlob() -- soporta
                // mostrarlo (decodificar) desde Safari 14, que es una cosa
                // muy distinta, y esa es la confusión con la que se eligió
                // WebP originalmente. En los dispositivos donde toBlob()
                // no reconoce 'image/webp', el callback recibe blob=null
                // -- eso es exactamente lo que hacía fallar la subida
                // completa desde iPhones/iPads: no había ningún blob que
                // subir. JPEG sí es 100% soportado por toBlob() en todos
                // los navegadores/dispositivos relevantes desde hace años.
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Error al comprimir la imagen'));
                    }
                }, 'image/jpeg', quality);
            };
            
            img.onerror = () => reject(new Error('Error al cargar la imagen'));
        };
        
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
    });
}

export function createImagePreview(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => resolve(e.target.result);
    });
}
