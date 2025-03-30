// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.
function composite( bgImg, fgImg, fgOpac, fgPos )
{
        
    let bg_data=bgImg.data;
    let fg_data_cache=fgImg.data;

    let fg_width=fgImg.width;
    let fg_height=fgImg.height;

    let bg_width=bgImg.width;
    let bg_height=bgImg.height;

    let fg_data=new Array();

    if (fgPos.y>=0){
        fg_data=fg_data.concat(new Array(bg_width*4*fgPos.y).fill(0));
    }

    for (let i=0; i<fg_height; i++){
        if (fgPos.x<0){
            if (fgPos.y<0){
                fg_data.push(...fg_data_cache.slice((i-fgPos.y)*fg_width*4-fgPos.x*4,(i-fgPos.y)*fg_width*4+(fg_width)*4));
            }else{
                fg_data.push(...fg_data_cache.slice(i*fg_width*4-fgPos.x*4,i*fg_width*4+(fg_width)*4));
            }
            fg_data.push(...new Array((bg_width-(fgPos.x+fg_width))*4).fill(0));
        }else if (bg_width>fgPos.x && fgPos.x>bgImg.width-fgImg.width){
            fg_data.push(...new Array(fgPos.x*4).fill(0));
            if (fgPos.y<0){
                fg_data.push(...fg_data_cache.slice((i-fgPos.y)*fg_width*4,(i-fgPos.y)*fg_width*4+(fg_width)*4-(fgPos.x+fg_width-bg_width)*4));
            }else{
                fg_data.push(...fg_data_cache.slice(i*fg_width*4,i*fg_width*4+(fg_width)*4-(fgPos.x+fg_width-bg_width)*4));
            }
        }else if (fgPos.x<=bgImg.width-fgImg.width){
            fg_data.push(...new Array(fgPos.x*4).fill(0));
            if (fgPos.y<0){
                fg_data.push(...fg_data_cache.slice((i-fgPos.y)*fg_width*4,(i-fgPos.y)*fg_width*4+(fg_width)*4));
            }else{
                fg_data.push(...fg_data_cache.slice(i*fg_width*4,i*fg_width*4+(fg_width)*4));
            }
            fg_data.push(...new Array((bg_width-(fgPos.x+fg_width))*4).fill(0));
        }
    }

    let remainder=bg_data.length-fg_data.length;
    for (let i=0; i<remainder; i++){
        fg_data.push(0);
    }

    for (let i=0; i<fg_data.length; i+=4){
        
        let fg_red = fg_data[i];
        let fg_green = fg_data[i+1];
        let fg_blue = fg_data[i+2];
        let fg_alpha =(fg_data[i+3]/255)*fgOpac;
        
        let bg_red =bg_data[i];
        let bg_green = bg_data[i+1];
        let bg_blue = bg_data[i+2];
        let bg_alpha = bg_data[i+3]/255;

        bg_data[i] = (fg_alpha*fg_red + (1-fg_alpha)*bg_alpha*bg_red)/(fg_alpha+(1-fg_alpha)*bg_alpha);
        bg_data[i+1] = (fg_alpha*fg_green + (1-fg_alpha)*bg_alpha*bg_green)/(fg_alpha+(1-fg_alpha)*bg_alpha);
        bg_data[i+2] = (fg_alpha*fg_blue + (1-fg_alpha)*bg_alpha*bg_blue)/(fg_alpha+(1-fg_alpha)*bg_alpha);
    }

}
