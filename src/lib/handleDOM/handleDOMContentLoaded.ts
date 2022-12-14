import reportTracker from '../../utils/reportTracker';
export default function handleDOMContentLoaded(): void {
  document.addEventListener('DOMContentLoaded', function (e) {
    console.log(e.timeStamp);
    const info = {
      name: 'Domready',
      DOMReady: e.timeStamp,
    };
    reportTracker(info);
  });
}
