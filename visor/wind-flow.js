// Trace an instantaneous streamline in the sampled vector field.
export function traceWind(seed, grid, columns, speeds, bearings) {
  const lastRow = grid.length / columns - 1;
  const south = grid[0][0], west = grid[0][1];
  const dLat = grid[columns][0]-south, dLon = grid[1][1]-west;
  let [lat,lon] = seed;
  const path = [[lat,lon]];
  for (let step=0; step<16; step++) {
    const y=(lat-south)/dLat, x=(lon-west)/dLon;
    if (x<0 || y<0 || x>=columns-1 || y>=lastRow) break;
    const row=Math.floor(y), col=Math.floor(x), a=x-col, b=y-row;
    const start=row*columns+col;
    let east=0, north=0;
    for (const [offset,weight] of [[0,(1-a)*(1-b)],[1,a*(1-b)],[columns,(1-a)*b],[columns+1,a*b]]) {
      const i=start+offset;
      if (!Number.isFinite(speeds[i]) || !Number.isFinite(bearings[i])) return path;
      const direction=bearings[i]*Math.PI/180;
      east-=weight*speeds[i]*Math.sin(direction);
      north-=weight*speeds[i]*Math.cos(direction);
    }
    const speed=Math.hypot(east,north);
    if (speed<1) break;
    const distance=Math.min(dLat,dLon*Math.cos(lat*Math.PI/180))/14;
    lat+=distance*north/speed;
    lon+=distance*east/(speed*Math.cos(lat*Math.PI/180));
    if (lat<south || lon<west || lat>grid.at(-1)[0] || lon>grid.at(-1)[1]) break;
    path.push([lat,lon]);
  }
  return path;
}
