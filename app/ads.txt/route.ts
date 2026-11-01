import {ADSENSE_ID} from '@/lib/seo';
export const dynamic='force-dynamic';
export function GET(){
 if(!ADSENSE_ID)return new Response('AdSense publisher has not been configured.\n',{status:404,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
 return new Response(`google.com, ${ADSENSE_ID.slice(3)}, DIRECT, f08c47fec0942fa0\n`,{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=300'}});
}
