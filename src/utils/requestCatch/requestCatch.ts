    //接口异常采集
    import reportTracker from '../publicReport/publicReport'
    function requestCatch <T extends keyof XMLHttpRequest>(type1:T,type2:T){
      let oldopen =  XMLHttpRequest.prototype[type1]
      let oldosend =  XMLHttpRequest.prototype[type2]
      let logData ={
         method:'',
         url:'',
      }
      XMLHttpRequest.prototype.open = function(
         method: string,
         url: string,
         async?:boolean
      ){
         logData = {
            method,
            url,
         }
         return oldopen.apply(this,arguments)
      }
      let startTime: number
      XMLHttpRequest.prototype.send = function(body){
         if(logData){
            //发送时候记录时间
            startTime = Date.now()
            const handler = (type: string) =>(event: any): void=>{
               let duration = Date.now() - startTime
               let status = this.status
               let statusText = this.statusText
               let requestInfo = {
                  type:'xhr',
                  eventType : event.type,
                  pathName:logData.url,
                  status:status+ '-' + statusText,
                  duration,
                  response:this.response ? JSON.stringify(this.response) : '',
                  params:body || ''
               }
               reportTracker(requestInfo)
            }
           
            this.addEventListener('load',handler('load'),false)
            this.addEventListener('error',handler('error'),false)
            this.addEventListener('abort',handler('abort'),false)
         }
   
          oldosend.apply(this,arguments) 
      }
    }


    export default requestCatch
