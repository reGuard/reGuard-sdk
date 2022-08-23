import reportTracker from "../../utils/reportTracker";
const MouseEventList: string[] = ["click", "dblclick", "contextmenu", "mousedown", "mouseup", "mouseenter", "mouseout", "mouseover"];

export default function () {
    MouseEventList.forEach((ev) => {
        window.addEventListener(ev, (e) => {
            const target = e.target as HTMLElement;
            const targetKey = target.getAttribute("target-key");
            if (targetKey) {
                let info = {
                    name: "targetDom",
                    event: ev,
                    target: targetKey,
                };
                reportTracker(info);
            }
        });
    });
}
