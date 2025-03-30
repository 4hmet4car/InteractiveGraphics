// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.
function composite(bgImg, fgImg, fgOpac, fgPos) {
    // Extract background and foreground data and dimensions.
    const bgData = bgImg.data;
    const fgDataCache = fgImg.data;
    const fgWidth = fgImg.width, fgHeight = fgImg.height;
    const bgWidth = bgImg.width, bgHeight = bgImg.height;
    
    // Initialize a background array sized foreground array.
    const fgData = new Uint8ClampedArray(bgWidth * bgHeight * 4);
    
    // Compute the overlapping rectangle between foreground (offset by fgPos) and background.
    const startX = Math.max(fgPos.x, 0);
    const startY = Math.max(fgPos.y, 0);
    const endX = Math.min(fgPos.x + fgWidth, bgWidth);
    const endY = Math.min(fgPos.y + fgHeight, bgHeight);
    
    // Determine where to start reading from the foreground image.
    const srcStartX = Math.max(0, -fgPos.x);
    const srcStartY = Math.max(0, -fgPos.y);
    
    // Copy pixels from the foreground image into fgData at the proper location.
    for (let y = startY, sy = srcStartY; y < endY; y++, sy++) {
        for (let x = startX, sx = srcStartX; x < endX; x++, sx++) {
            const destIndex = (y * bgWidth + x) * 4;
            const srcIndex  = (sy * fgWidth + sx) * 4;
            fgData[destIndex]     = fgDataCache[srcIndex];
            fgData[destIndex + 1] = fgDataCache[srcIndex + 1];
            fgData[destIndex + 2] = fgDataCache[srcIndex + 2];
            fgData[destIndex + 3] = fgDataCache[srcIndex + 3];
        }
    }
    
    // Blend the two images using the alpha blending formula.
    // Go over every pixel of the background.
    for (let i = 0; i < bgData.length; i += 4) {
        const fgRed   = fgData[i],
              fgGreen = fgData[i + 1],
              fgBlue  = fgData[i + 2];
        // Compute effective foreground alpha scaled by fgOpac.
        const fgAlpha = (fgData[i + 3] / 255) * fgOpac;
        
        const bgRed   = bgData[i],
              bgGreen = bgData[i + 1],
              bgBlue  = bgData[i + 2],
              bgAlpha = bgData[i + 3] / 255;
        
        // Compute the denominator of the formula. Avoid division by zero.
        const denom = fgAlpha + (1 - fgAlpha) * bgAlpha;
        if (denom > 0) {
            bgData[i]     = (fgAlpha * fgRed   + (1 - fgAlpha) * bgAlpha * bgRed)   / denom;
            bgData[i + 1] = (fgAlpha * fgGreen + (1 - fgAlpha) * bgAlpha * bgGreen) / denom;
            bgData[i + 2] = (fgAlpha * fgBlue  + (1 - fgAlpha) * bgAlpha * bgBlue)  / denom;
        }
    }
}