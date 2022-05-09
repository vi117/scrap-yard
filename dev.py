#! /usr/bin/env python3
import subprocess
import argparse

parser = argparse.ArgumentParser(description='Runs a development server.')

def runFrontend(args = None):
    args = args if args else []
    print('Running frontend...')
    p = subprocess.Popen(['pnpm', 'dev',*args],cwd="frontend")
    return p

def runBackend(args = None):
    args = args if args else []
    print('Running backend...')
    p = subprocess.Popen(['deno','task','serve', *args],cwd="backend")
    return p

if __name__ == '__main__':
    args = parser.parse_args()
    
    frontendProcess = runFrontend()
    backendProcess = runBackend()
    frontendProcess.wait()
    backendProcess.wait()