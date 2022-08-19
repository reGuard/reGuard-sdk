import reportTracker from '../../utils/publicReport'
const MouseEventList: string[] = ["click", "dblclick", "contextmenu", "mousedown", "mouseup", "mouseenter", "mouseout", "mouseover"];

export default function () {
    MouseEventList.forEach((ev) => {
        window.addEventListener(ev, (e) => {
            const target = e.target as HTMLElement;
            const targetKey = target.getAttribute("target-key");
            if (targetKey) {
                    let info = {
                        event: ev,
                        target: targetKey,
                    }
                    console.log(info)
                    reportTracker('/Tarcker',info)
                
            }
        });
    });
}
