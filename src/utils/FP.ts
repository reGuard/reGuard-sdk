export default function FPTracker(){
    const entryHandler = (list: any) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-paint') {
            observer.disconnect()
            console.log('FPtime',entry.startTime)
          }
          
        }
       
      }
      const observer = new PerformanceObserver(entryHandler)
      observer.observe({ type: 'paint', buffered: true })
}

