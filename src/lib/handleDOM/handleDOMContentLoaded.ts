import  reportTracker  from "../../utils/publicReport";
export default function handleDOMContentLoaded(): void {
    document.addEventListener("DOMContentLoaded", function (e) {
        console.log(e.timeStamp);
        let info = {
            name:'Domready',
            DOMReady:e.timeStamp
        }
        reportTracker(info,'http://43.142.180.91:3000/tracker')
    });
}
