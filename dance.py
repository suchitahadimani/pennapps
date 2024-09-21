import numpy as np
import json
import time
import cv2 as cv

BODY_PARTS = {
    "Nose": 0, "Neck": 1, "RShoulder": 2, "RElbow": 3, "RWrist": 4,
    "LShoulder": 5, "LElbow": 6, "LWrist": 7, "RHip": 8, "RKnee": 9,
    "RAnkle": 10, "LHip": 11, "LKnee": 12, "LAnkle": 13, "REye": 14,
    "LEye": 15, "REar": 16, "LEar": 17, "Background": 18
}

width, height = 368, 368
inWidth, inHeight = width, height

net = cv.dnn.readNetFromTensorflow("human-pose-estimation-opencv/graph_opt.pb")
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

# Open video capture
cap = cv.VideoCapture(0)  # 0 for webcam, or use a video file path

# Get video properties
frame_width = int(cap.get(cv.CAP_PROP_FRAME_WIDTH))
frame_height = int(cap.get(cv.CAP_PROP_FRAME_HEIGHT))
fps = 30  # Set a fixed FPS

# Define the codec and create VideoWriter object
fourcc = cv.VideoWriter_fourcc(*'mp4v')  # Try 'mp4v' codec
out = cv.VideoWriter('output.mp4', fourcc, fps, (frame_width, frame_height))

frames_data = []
start_time = time.time()
duration = 2  # Record for 10 seconds

while (time.time() - start_time) < duration:
    ret, frame = cap.read()
    if not ret:
        break
    
    current_time = time.time() - start_time
    frame_data = poseDetector(frame, current_time)
    frames_data.append(frame_data)
    print(f"Time elapsed: {current_time:.2f}s, Frames captured: {len(frames_data)}")
    
    # Visualize keypoints
    for part, data in frame_data["keypoints"].items():
        if data:
            cv.circle(frame, (data["x"], data["y"]), 3, (0, 255, 0), -1)
    
    # Write the frame to the output video
    out.write(frame)
    
    cv.imshow('OpenPose', frame)
    
    if cv.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
out.release()
cv.destroyAllWindows()

# Final save of JSON data
with open('pose_data.json', 'w') as f:
    json.dump(frames_data, f, indent=2)

print("Video recording and pose detection completed.")