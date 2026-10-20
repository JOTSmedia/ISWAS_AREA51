import assert from 'node:assert/strict';
import {arrangeBooks,PERIMETER_SHELVES} from '../assets/decorative-books-v17-11.js';
let counts={desktop:0,mobile:0};
for(const mobile of [false,true])for(const wall of PERIMETER_SHELVES){
 const books=arrangeBooks({...wall,mobile});
 counts[mobile?'mobile':'desktop']+=books.length;
 assert.deepEqual(books,arrangeBooks({...wall,mobile}),'deterministic placement across remounts');
 for(let row=0;row<wall.ys.length;row++)for(let bay=0;bay<wall.divisions;bay++){
  const rowBooks=books.filter(b=>b.row===row&&b.bay===bay);
  assert.ok(rowBooks.length>8,`${wall.name} row ${row}, bay ${bay} must be visibly stocked`);
  const occupied=rowBooks.reduce((sum,b)=>sum+b.width,0);
  assert.ok(occupied/(wall.length/wall.divisions-.13)>.85,'each bay filled at least 85%');
 }
 for(const b of books){
  const halfWidth=(Math.abs(Math.cos(b.lean))*b.width+Math.abs(Math.sin(b.lean))*b.height)/2;
  assert.ok(b.x-halfWidth>=b.left-1e-6,'book must clear left mullion');
  assert.ok(b.x+halfWidth<=b.right+1e-6,'book must clear right mullion');
  assert.ok(b.depth<=.28&&b.z+b.depth/2<(b.display?.955:.30),'book must remain on the shallow shelf');
  assert.ok(b.height>0&&b.width>0,'valid geometry');
  if(b.display){const mid=-wall.length/2+(b.bay+.5)*wall.length/wall.divisions;assert.ok(Math.abs(b.x-mid)-halfWidth>=.25-1e-6,'display clusters clear busts');assert.ok(b.y+b.height/2<3.05,'display books remain below gallery rail')}
  if(wall.name==='front upper wall')assert.ok(b.y-b.height/2>=6.4,'mirror and art remain clear');
 }
}
assert.equal(PERIMETER_SHELVES.reduce((n,w)=>n+w.ys.length,0),57);
assert.ok(counts.mobile<counts.desktop,'mobile density reduces geometry while keeping every row filled');
console.log(`Decorative shelves: 57 stocked rows + three display ledges; ${counts.desktop} desktop / ${counts.mobile} mobile books; shelf bounds and mirror clearance passed.`);
