FROM python:3.13-slim
WORKDIR /lab
COPY lab.py .
USER 65534:65534
EXPOSE 8080
CMD ["python", "-B", "lab.py"]
