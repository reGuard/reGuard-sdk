export default function DOMTracker(): void{
    document.addEventListener('DOMContentLoaded',function(){
        console.log('DOMReady: True',new Date());
    });
}