const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
let count=0;
for(const name of fs.readdirSync(root)){
  if(name.endsWith('.js')){new vm.Script(fs.readFileSync(path.join(root,name),'utf8'),{filename:name});count++;}
  if(name.endsWith('.html')){
    const content=fs.readFileSync(path.join(root,name),'utf8');
    for(const match of content.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
      if(/src=|application\/ld\+json/i.test(match[1]))continue;
      new vm.Script(match[2],{filename:name});count++;
    }
  }
}
console.log(`${count} JavaScript files and inline scripts parsed successfully.`);
