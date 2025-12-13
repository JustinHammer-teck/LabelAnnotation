from django.contrib.auth.decorators import login_required
from django.shortcuts import render


@login_required
def aviation_page(request, path=''):
    return render(request, 'aviation/index.html')
