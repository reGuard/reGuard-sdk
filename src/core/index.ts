import  type {DefaultOptons,Optins} from "../type/index"
import {TrackerConfig} from '../type/index'
import { createHistoryEvent } from "../utils/pv"
import FPTracker from "../utils/FP"

export default class Tracker{
    public  data: Optins
    constructor(options: Optins) {
        this.data = Object.assign(this.initDef(),options)
        this.installTracker()
    }
    //初始化函数
    private initDef() : DefaultOptons{
        window.history['pushState'] = createHistoryEvent('pushState')
        window.history['replaceState'] = createHistoryEvent('replaceState')
        return<DefaultOptons>{
            sdkVersion:TrackerConfig.version,
            historyTracker:false,
            hashTracker:false,
            domTracker:false,
            jsError:false
}
}
   
    //targetKey自定义 例如history-pv
    private captureEvents <T>(mouseEventList: string[], targetKey: string, data?:T){
        mouseEventList.forEach(item =>{
            window.addEventListener(item,()=>{
                console.log('监听到了')
                this.reportTracker({item,targetKey,data})
            })
        })

    }
    //设置用户id
    public setUserId<T extends DefaultOptons['uuid'] >(uuid: T){
        this.data.uuid = uuid
    }

    //上报请求
    private reportTracker<T>(data: T){
        const params = Object.assign(this.data,data,{time:new Date().getTime()})
        let headers = {
            type: 'application/x-www-form-urlencoded'
        }
        //封装blob
        let blob  = new Blob([JSON.stringify(params)],headers)
        navigator.sendBeacon(this.data.requestUrl,blob)
        
    }
    //手动上报
    public sendReport<T>(data: T){
        this.reportTracker(data)
    }


    private installTracker(){
        //history模式监控
        if(this.data.historyTracker){
            this.captureEvents(['pushState','replaceState','popstate'],'history-pv')
        }
        //hash模式
        if(this.data.hashTracker){
            this.captureEvents(['hashchange'],'hash-pv')
        }
        //Fp监控
        if(this.data.FPTracker){
            FPTracker()
            
        }
        }


    }

