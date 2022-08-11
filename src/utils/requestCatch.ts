
    //接口异常采集
 export const  captureRequest = ()=>{
     let origin = XMLHttpRequest
     XMLHttpRequest.prototype.open = function(
        method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null
     ){
        
     }
    }
    