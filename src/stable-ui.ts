/** Preserve input node identity across live measurement updates: a click spans down/up. */
export function patchHTML(root:HTMLElement,html:string){
 const template=document.createElement('template');template.innerHTML=html;
 function key(n:Node){return n instanceof Element?(n.id||n.getAttribute('data-object')||''):'';}
 function sync(parent:Node,source:Node){
  const old=Array.from(parent.childNodes),used=new Set<Node>();let cursor=parent.firstChild;
  for(const next of Array.from(source.childNodes)){
   const k=key(next);let node:Node|undefined=old.find(n=>!used.has(n)&&n.nodeType===next.nodeType&&n.nodeName===next.nodeName&&(k?key(n)===k:!key(n)));
   if(!node)node=next.cloneNode(true);
   used.add(node);if(node!==cursor)parent.insertBefore(node,cursor);
   if(node instanceof Element&&next instanceof Element){for(const a of Array.from(node.attributes))if(!next.hasAttribute(a.name))node.removeAttribute(a.name);for(const a of Array.from(next.attributes))if(node.getAttribute(a.name)!==a.value)node.setAttribute(a.name,a.value);sync(node,next);}
   else if(node.nodeValue!==next.nodeValue)node.nodeValue=next.nodeValue;
   cursor=node.nextSibling;
  }
  for(const n of old)if(!used.has(n))parent.removeChild(n);
 }
 sync(root,template.content);
}

