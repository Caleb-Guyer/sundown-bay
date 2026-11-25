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
  // Moving traffic uses its own grid. A driver only needs the thin strip of
  // road from its bumper to its stopping horizon, including on diagonal bends.
  class LaneSpace {
    constructor(){this.cells=new Map();this.used=[];}
    key(p){return Math.floor(p.x/24)*65536+Math.floor(p.z/24);}
    cell(key){
      let cell=this.cells.get(key);
      if(!cell){cell={cars:[],walkers:[]};this.cells.set(key,cell);}
      if(!cell.cars.length&&!cell.walkers.length)this.used.push(cell);
      return cell;
    }
    rebuild(cars,walkers,passenger){
      for(const cell of this.used){cell.cars.length=0;cell.walkers.length=0;}
      this.used.length=0;
      for(const v of cars)this.cell(this.key(v)).cars.push(v);
      for(const p of walkers)if(!p.palmPassenger&&p!==passenger)this.cell(this.key(p)).walkers.push(p);
    }
    moved(car,from){
      const key=this.key(car);if(key===from)return;
      const cars=this.cells.get(from).cars;
      cars.splice(cars.indexOf(car),1);this.cell(key).cars.push(car);
    }
    ahead(v,ux,uz,driver,skip){
      const endX=v.x+20*ux,endZ=v.z+20*uz;
      const left=Math.floor((Math.min(v.x,endX)-1.75)/24),right=Math.floor((Math.max(v.x,endX)+1.75)/24);
      const south=Math.floor((Math.min(v.z,endZ)-1.75)/24),north=Math.floor((Math.max(v.z,endZ)+1.75)/24);
      let gap=Infinity;
      for(let i=left;i<=right;i++)for(let j=south;j<=north;j++){
        const cell=this.cells.get(i*65536+j);if(!cell)continue;
        for(const q of cell.cars){
          if(q===v||q===driver||q===skip)continue;
          const x=q.x-v.x,z=q.z-v.z,front=x*ux+z*uz;
          if(front>.1&&front<20&&Math.abs(x*uz-z*ux)<1.75)gap=Math.min(gap,Math.max(0,front-4.65));
        }
        for(const q of cell.walkers){
          if(q===skip)continue;
          const x=q.x-v.x,z=q.z-v.z,front=x*ux+z*uz;
          if(Math.abs(x)<17&&Math.abs(z)<17&&front>.1&&front<20&&Math.abs(x*uz-z*ux)<1.15)gap=Math.min(gap,Math.max(0,front-2.95));
        }
      }
      return gap;
    }
  }
  window.BayLaneSpace=LaneSpace;
})();
