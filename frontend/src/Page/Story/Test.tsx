import { Button, Paper } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { atom, RecoilState, useRecoilValue, useSetRecoilState } from "recoil";


class Foo{
    l: string[] = [];
    token: RecoilState<number>;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor(){
        this.token = atom({
            key:"FooRefresh",
            default: 0
        })
    }
    refresh(){
        const s = useSetRecoilState(this.token);
        s(Date.now());
    }
}

function useRefreshToken():[number,()=>void]{
    const [n,setN] = useState(Date.now());
    const reset = useCallback(()=> setN(Date.now()),[n]);
    return [n, reset];
}

let count = 0;
const a: {
    key: string,
    value: {
        deep: string
    },
}[] = [];
let idgen = 0;

export function TestP(props:{value:typeof a[0]}){
    return <p>{props.value.key}
        <div>{props.value.value.deep}</div>
    </p>;
}

export function TestStorybook(){
    const [time,refresh] = useRefreshToken();
    useEffect(()=>{
        count++;
    })
    return <Paper>
        {new Date(time).toLocaleTimeString()}: {count}
        <Button onClick={refresh}> Reload</Button>
        <Button onClick={()=>{a.push({
            key:`${idgen++}`,
            value: {deep:`${Math.random()}`}});}}>Add</Button>
        <Button onClick={()=>{ a[0].value.deep = `${Math.random()}`;}} >change</Button>
        <div>
        {a.map((x)=>(<TestP key={x.key} value={x}></TestP>))}
        </div>
    </Paper>
}