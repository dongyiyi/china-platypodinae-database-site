/* GA4: one manual page_view per canonical Platypodinae page or hash route. */
(function(){
 'use strict';
 const ID='G-SW59SLYB76';
 const BASE=location.origin+'/china-platypodinae-database-site/';
 window.dataLayer=window.dataLayer||[];
 window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
 window.gtag('js',new Date());
 window.gtag('config',ID,{send_page_view:false});
 let lastKey=null;
 function track(){
  const match=location.pathname.match(/\/taxa\/(PLT_\d{6})\/?$/);
  const section=(location.hash.slice(1)||'/').split('?')[0];
  const key=match?'taxon:'+match[1]:'section:'+section;
  if(key===lastKey)return;
  lastKey=key;
  const url=match?BASE+'taxa/'+match[1]+'/':BASE+(section==='/'?'':'#'+section);
  window.gtag('event','page_view',{page_location:url,page_title:document.title,page_referrer:document.referrer||undefined});
 }
 track();
 window.addEventListener('hashchange',track);
 window.addEventListener('popstate',track);
}());
