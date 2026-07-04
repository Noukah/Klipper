import JSZip from 'jszip';

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export async function processImage(file: File): Promise<{ image: HTMLImageElement, boxes: BoundingBox[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const boxes = findConnectedComponents(img);
        resolve({ image: img, boxes });
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function findConnectedComponents(img: HTMLImageElement): BoundingBox[] {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error("Could not get 2d context");

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  const visited = new Uint8Array(width * height);
  const boxes: BoundingBox[] = [];

  // Detect background color from the top-left pixel
  const bgR = data[0];
  const bgG = data[1];
  const bgB = data[2];
  const bgA = data[3];

  const tolerance = 40; // Color distance tolerance
  
  const isForeground = (r: number, g: number, b: number, a: number) => {
    if (bgA < 10) {
      // If background is transparent, anything opaque is foreground
      return a > 10;
    } else {
      // If pixel is transparent, it's NOT foreground
      if (a < 10) return false;
      
      // Calculate color distance (Euclidean)
      const dist = Math.sqrt(Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2));
      return dist > tolerance;
    }
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];

      if (!visited[y * width + x] && isForeground(r, g, b, a)) {
        // Start BFS
        const box = { minX: x, minY: y, maxX: x, maxY: y };
        const queue: { x: number, y: number }[] = [{ x, y }];
        visited[y * width + x] = 1;

        while (queue.length > 0) {
          const current = queue.shift()!;

          if (current.x < box.minX) box.minX = current.x;
          if (current.x > box.maxX) box.maxX = current.x;
          if (current.y < box.minY) box.minY = current.y;
          if (current.y > box.maxY) box.maxY = current.y;

          // Check 4-way neighbors
          const neighbors = [
            { x: current.x - 1, y: current.y },
            { x: current.x + 1, y: current.y },
            { x: current.x, y: current.y - 1 },
            { x: current.x, y: current.y + 1 }
          ];

          for (const n of neighbors) {
            if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height) {
              const nIndex1D = n.y * width + n.x;
              if (!visited[nIndex1D]) {
                const nIndex4 = nIndex1D * 4;
                const nR = data[nIndex4];
                const nG = data[nIndex4 + 1];
                const nB = data[nIndex4 + 2];
                const nA = data[nIndex4 + 3];
                
                if (isForeground(nR, nG, nB, nA)) {
                  visited[nIndex1D] = 1;
                  queue.push(n);
                }
              }
            }
          }
        }

        const boxWidth = box.maxX - box.minX + 1;
        const boxHeight = box.maxY - box.minY + 1;

        if (boxWidth >= 5 && boxHeight >= 5) {
          boxes.push(box);
        }
      }
    }
  }

  // Sort primarily top-to-bottom, secondarily left-to-right
  boxes.sort((a, b) => {
    // If they are somewhat on the same horizontal line, sort left to right
    if (Math.abs(a.minY - b.minY) < Math.min(a.maxY - a.minY, b.maxY - b.minY) / 2) {
        return a.minX - b.minX;
    }
    return a.minY - b.minY;
  });

  return boxes;
}

export function findComponentAt(img: HTMLImageElement, startX: number, startY: number): BoundingBox | null {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  if (startX < 0 || startX >= width || startY < 0 || startY >= height) return null;

  const startIndex = (startY * width + startX) * 4;
  const targetR = data[startIndex];
  const targetG = data[startIndex + 1];
  const targetB = data[startIndex + 2];
  const targetA = data[startIndex + 3];

  const tolerance = 50;
  const isSimilar = (r: number, g: number, b: number, a: number) => {
    if (targetA < 10) return a < 10;
    if (a < 10) return false;
    const dist = Math.sqrt(Math.pow(r - targetR, 2) + Math.pow(g - targetG, 2) + Math.pow(b - targetB, 2));
    return dist <= tolerance;
  };

  const visited = new Uint8Array(width * height);
  const queue: { x: number, y: number }[] = [{ x: startX, y: startY }];
  visited[startY * width + startX] = 1;

  const box = { minX: startX, minY: startY, maxX: startX, maxY: startY };

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.x < box.minX) box.minX = current.x;
    if (current.x > box.maxX) box.maxX = current.x;
    if (current.y < box.minY) box.minY = current.y;
    if (current.y > box.maxY) box.maxY = current.y;

    const neighbors = [
      { x: current.x - 1, y: current.y },
      { x: current.x + 1, y: current.y },
      { x: current.x, y: current.y - 1 },
      { x: current.x, y: current.y + 1 }
    ];

    for (const n of neighbors) {
      if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height) {
        const nIndex1D = n.y * width + n.x;
        if (!visited[nIndex1D]) {
          const nIndex4 = nIndex1D * 4;
          if (isSimilar(data[nIndex4], data[nIndex4 + 1], data[nIndex4 + 2], data[nIndex4 + 3])) {
            visited[nIndex1D] = 1;
            queue.push(n);
          }
        }
      }
    }
  }

  // Si el componente encontrado es demasiado pequeño (ej. un píxel erróneo), podríamos descartarlo,
  // pero como es manual, permitimos cualquier tamaño razonable (ej. mayor a 5x5).
  if (box.maxX - box.minX > 5 && box.maxY - box.minY > 5) {
    return box;
  }
  return null;
}

export async function createZipFromCrops(image: HTMLImageElement, boxes: BoundingBox[]): Promise<Blob> {
  const zip = new JSZip();

  const promises = boxes.map((box, index) => {
    return new Promise<void>((resolve, reject) => {
      const boxWidth = box.maxX - box.minX + 1;
      const boxHeight = box.maxY - box.minY + 1;

      const canvas = document.createElement('canvas');
      canvas.width = boxWidth;
      canvas.height = boxHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Could not get context"));
        return;
      }

      ctx.drawImage(
        image,
        box.minX, box.minY, boxWidth, boxHeight,
        0, 0, boxWidth, boxHeight
      );

      canvas.toBlob((blob) => {
        if (blob) {
          const num = (index + 1).toString().padStart(2, '0');
          zip.file(`tarjeta_${num}.png`, blob);
          resolve();
        } else {
          reject(new Error("Blob creation failed"));
        }
      }, 'image/png');
    });
  });

  await Promise.all(promises);
  return zip.generateAsync({ type: 'blob' });
}
