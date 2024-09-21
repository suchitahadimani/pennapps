import numpy as np
import json
import time
import cv2 as cv
from flask import Flask, jsonify, send_file, abort, current_app
from pymongo import MongoClient
import gridfs
import io
from database_connection import get_database
import requests
from bson import ObjectId
import os





app = Flask(__name__)


# MongoDB setup
database = get_database('khakiai')
db = database['video']
fs = gridfs.GridFS(database)

BODY_PARTS = {
    "Nose": 0, "Neck": 1, "RShoulder": 2, "RElbow": 3, "RWrist": 4,
    "LShoulder": 5, "LElbow": 6, "LWrist": 7, "RHip": 8, "RKnee": 9,
    "RAnkle": 10, "LHip": 11, "LKnee": 12, "LAnkle": 13, "REye": 14,
    "LEye": 15, "REar": 16, "LEar": 17, "Background": 18
}

width, height = 368, 368
inWidth, inHeight = width, height


net = cv.dnn.readNetFromTensorflow(os.path.join(os.getcwd(), "api/human-pose-estimation-opencv/graph_opt.pb"))

#net = cv.dnn.readNetFromTensorflow("human-pose-estimation-opencv/graph_opt.pb")
thr = 0.2

def poseDetector(frame, timestamp):
    frameWidth = frame.shape[1]
    frameHeight = frame.shape[0]

    net.setInput(cv.dnn.blobFromImage(frame, 1.0, (inWidth, inHeight), (127.5, 127.5, 127.5), swapRB=True, crop=False))
    out = net.forward()
    out = out[:, :19, :, :]

    keypoints = {}

    for part, i in BODY_PARTS.items():
        heatMap = out[0, i, :, :]
        _, conf, _, point = cv.minMaxLoc(heatMap)
        x = int((frameWidth * point[0]) / out.shape[3])
        y = int((frameHeight * point[1]) / out.shape[2])

        if conf > thr:
            keypoints[part] = {"x": x, "y": y, "confidence": float(conf)}
        else:
            keypoints[part] = None

    return {
        "timestamp": timestamp,
        "keypoints": keypoints,
        "image_width": frameWidth,
        "image_height": frameHeight
    }

@app.route("/api/welcome")
def index():
    return "Welcome to the Dance Video Recorder API! Use /record to start recording."


@app.route('/api/record', methods=['GET'])
def record_video():
    cap = cv.VideoCapture(0)
    frame_width = int(cap.get(cv.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv.CAP_PROP_FRAME_HEIGHT))
    fps = 30

    fourcc = cv.VideoWriter_fourcc(*'mp4v')
    out = cv.VideoWriter('temp.mp4', fourcc, fps, (frame_width, frame_height))

    frames_data = []
    start_time = time.time()
    duration = 10

    

    while (time.time() - start_time) < duration:
        ret, frame = cap.read()
        if not ret:
            break
        
        current_time = time.time() - start_time
        frame_data = poseDetector(frame, current_time)
        frames_data.append(frame_data)
        print(f"Time elapsed: {current_time:.2f}s, Frames captured: {len(frames_data)}")
        
        for part, data in frame_data["keypoints"].items():
            if data:
                cv.circle(frame, (data["x"], data["y"]), 3, (0, 255, 0), -1)
        
        out.write(frame)

    cap.release()
    out.release()

    # Save video to MongoDB
    with open('temp.mp4', 'rb') as f:
        video_id = fs.put(f, filename='video.mp4')
    
    os.rename('temp.mp4', 'public/latest_video.mp4')

    # Save JSON data to MongoDB
    json_id = db.pose_data.insert_one({"frames": frames_data}).inserted_id

    return jsonify({"message": "Video and pose data recorded and saved to MongoDB",
                    "video_id": str(video_id),
                    "json_id": str(json_id)})



@app.route("/api/data", methods=['GET'])
def get_pose_data():
    # Fetch the most recent pose data from the database
    recent_pose_data = db.pose_data.find_one({}, sort=[('_id', -1)])  # Sort by _id descending to get the most recent document

    # Check if pose data is available
    if recent_pose_data:
        # Convert ObjectId to string
        recent_pose_data["_id"] = str(recent_pose_data["_id"])
        return jsonify(recent_pose_data), 200
    else:
        return jsonify({"message": "No pose data found."}), 404



@app.route('/api/download_video', methods=['GET'])
def download_latest_video():
    try:
        # Fetch the latest video from GridFS
        latest_video = fs.find_one(sort=[("uploadDate", -1)])  # Sort by uploadDate descending
        
        if latest_video:
            return send_file(io.BytesIO(latest_video.read()), mimetype='video/mp4', as_attachment=True, download_name='latest_video.mp4')
        else:
            return jsonify({"message": "No videos found."}), 404
    except Exception as e:
        print(f"Error retrieving latest video: {e}")
        abort(500)  # Internal server error


@app.route('/api/video', methods=['GET'])
def get_latest_video():
    try:
        # Fetch the latest video from GridFS
        latest_video = fs.find_one(sort=[("uploadDate", -1)])  # Sort by uploadDate descending
        
        if latest_video:
            # Stream the video directly to the browser
            return send_file(io.BytesIO(latest_video.read()), 
                             mimetype='video/mp4', 
                             as_attachment=False)  # Don't force download
        else:
            return jsonify({"message": "No videos found."}), 404
    except Exception as e:
        print(f"Error retrieving latest video: {e}")
        abort(500)  # Internal server error

@app.route('/api/random_message', methods=['GET'])
def random_message():

    recent_pose_data = db.pose_data.find_one({}, sort=[('_id', -1)])  # Sort by _id descending to get the most recent document

    # Check if pose data is available
    if recent_pose_data:
        # Convert ObjectId to string
        recent_pose_data["_id"] = str(recent_pose_data["_id"])
        #frames = jsonify(recent_pose_data), 200

    # Check if pose data is available
    if not recent_pose_data:
        return jsonify({"error": "No pose data available to generate message."}), 404

    # Step 2: Prepare messages based on the most recent pose data
    frames = recent_pose_data.get("frames", [])
    messages = ""
    for frame in frames:
        keypoints = frame.get("keypoints", {})
        # Create a string or some relevant content from keypoints
        if keypoints:
            message_content = f"Pose data at timestamp {frame['timestamp']}: {keypoints}"
            messages += (message_content)

    # Check if messages are available
    if messages == "":
        return jsonify({"error": "No pose data available to generate message."}), 404
    
    messages = " ".join(messages)[:6000]

    stream = False
    url = "https://proxy.tune.app/chat/completions"
    headers = {
        "Authorization": "sk-tune-5WwzTeJ6rfyOXpcCByWyOmX3zm1KECf6v5H",
        "Content-Type": "application/json",
    }
    data = {
        "temperature": 0.8,
        "messages": [{"role": "user", "content": f"Analyze the provided position coordinates and timestamps from the pose data. Generate a DIRECT (Do NOT explain your thought process) specifying the genre and overall vibe without filler content. Give ONE SENTENCE! {messages}"}],
        "model": "suchitahadimani/my-model",
        "stream": stream,
        "frequency_penalty": 0,
        "max_tokens": 900
    }

    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()  # Raise an error for bad responses
        message = response.json()
        choices = message["choices"]
        content = choices[0].get("message").get("content")
        return jsonify({"message": content}), 200
    except requests.exceptions.RequestException as e:
        print(f"Error generating random message: {e}")
        return jsonify({"error": "Failed to generate message."}), 500
    
@app.route("/api/python")
def hello_world():
    return "<p>Hello, World!</p>"


if __name__ == "__main__":
    app.run(debug=True)