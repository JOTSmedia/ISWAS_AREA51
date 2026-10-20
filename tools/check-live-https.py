#!/usr/bin/env python3
"""Verify GitHub's live TLS certificate and redirect behavior without bypassing TLS."""
import sys,ssl,urllib.request,urllib.error
HOST='itstartedwithascream.com'
class SecureRedirects(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,req,fp,code,msg,headers,newurl):
  if newurl.lower().startswith('http:'):
   raise RuntimeError('A live redirect downgrades HTTPS to HTTP: '+newurl)
  return super().redirect_request(req,fp,code,msg,headers,newurl)
opener=urllib.request.build_opener(urllib.request.HTTPSHandler(context=ssl.create_default_context()),SecureRedirects())
try:
 with opener.open('https://'+HOST+'/',timeout=20) as response:
  assert response.status==200
  print('PASS: trusted HTTPS certificate and root page:',response.geturl())
 with opener.open('http://'+HOST+'/',timeout=20) as response:
  if not response.geturl().startswith('https://'+HOST):raise RuntimeError('Enable Enforce HTTPS in GitHub Pages; HTTP is not redirected at the edge.')
  print('PASS: HTTP redirects to the HTTPS domain at GitHub Pages')
 with opener.open('https://'+HOST+'/plates/share-black-lodge-v18-1.jpg',timeout=20) as response:
  if response.headers.get_content_type()!='image/jpeg' or response.read(2)!=b'\xff\xd8':raise RuntimeError('Upload the v17.14 JPEG share image to the publishing root.')
  print('PASS: public HTTPS share image is available to crawlers')
except Exception as error:
 print('NOT READY:',str(error))
 if isinstance(error,urllib.error.HTTPError) and error.code==404:
  print('The new preview JPEG is not deployed yet. Upload the v17.14 release contents, then check again. HTTPS checks above remain valid.')
 else:
  print('Check GitHub Pages custom-domain, certificate and Enforce HTTPS status. Site files cannot issue or replace the server certificate.')
 sys.exit(1)
