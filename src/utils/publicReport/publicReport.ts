export default function reportTracker<T>(params: T){
    let headers = {
        type: 'application/x-www-form-urlencoded'
    }
    //封装blob
    let blob  = new Blob([JSON.stringify(params)],headers)
    navigator.sendBeacon('http://localhost:9000/tracker',blob)
    
}