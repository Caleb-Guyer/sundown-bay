/* A padded tile covers an entire short collision sweep. Its objects retain their original order. */
(() => {
  class StreetSpace {
    constructor(blocks,padding){
      this.all=blocks;this.padding=padding;this.tiles=new Map();this.empty=[];
      for(const b of blocks){
        const w=b.w*.5+padding,d=b.d*.5+padding;
        for(let i=Math.floor((b.x-w)/16);i<=Math.floor((b.x+w)/16);i++)
          for(let j=Math.floor((b.z-d)/16);j<=Math.floor((b.z+d)/16);j++){
            const k=i*4096+j;if(!this.tiles.has(k))this.tiles.set(k,[]);this.tiles.get(k).push(b);
          }
      }
    }
    near(x,z,reach){return reach>this.padding?this.all:this.tiles.get(Math.floor(x/16)*4096+Math.floor(z/16))||this.empty;}
  }
  window.BayStreetSpace=StreetSpace;
})();
