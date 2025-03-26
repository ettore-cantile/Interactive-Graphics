//Ettore Cantile 2026562
// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.
function composite( bgImg, fgImg, fgOpac, fgPos )
{

  for (let y=0; y<fgImg.height; ++y)     //I have to focus on every single pixel of the foreground image
  {
    for (let x=0; x<fgImg.width; ++x)
     {
        let fgPixel = (x + y*fgImg.width) * 4;    // each pixel is represented as an array with 4 values (rgba), so i need to multiply for 4.
        let bgPixel = ((fgPos.x + x) + (fgPos.y + y) * bgImg.width) * 4;  // I find the corresponding pixel in the background


        // Now we want to handle the alpha channel, we consider the value between 0 and 1.
        let fgAlpha=fgImg.data[fgPixel + 3]/255 * fgOpac;
        let bgAlpha=bgImg.data[bgPixel + 3]/255;
        let finalAlpha=fgAlpha + bgAlpha*(1 - fgAlpha);

        if (finalAlpha>0)
        {
          for (let color=0; color<3; ++color)
          {
            bgImg.data[bgPixel + color]=(fgImg.data[fgPixel + color]*fgAlpha + bgImg.data[bgPixel + color]*bgAlpha*(1 - fgAlpha))/finalAlpha;
          }
        }

        //We change the alpha value in the corresponding pixel
        bgImg.data[bgPixel + 3]=finalAlpha*255;
     }
  }
}
