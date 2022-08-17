const MouseEventList: string[] = ["click", "dblclick", "contextmenu", "mousedown", "mouseup", "mouseenter", "mouseout", "mouseover"];

export default function () {
    MouseEventList.forEach((ev) => {
        window.addEventListener(ev, (e) => {
            const target = e.target as HTMLElement;
            const targetKey = target.getAttribute("target-key");
            if (targetKey) {
                console.log(
                    {
                        event: ev,
                        target: targetKey,
                    },
                    "监听到了"
                );
            }
        });
    });
}
