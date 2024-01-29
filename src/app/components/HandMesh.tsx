// HandMesh.tsx
"use client";
import * as handpose from "@tensorflow-models/handpose";
import "@tensorflow/tfjs-backend-webgl";
import React, { useEffect, useRef, useState } from "react";

const HandMesh: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [thumb_x_coordinates, setThumb_x_coordinates] = useState([0, 0]);
  const [index_x_coordinates, setIndex_x_coordinates] = useState([0, 0]);
  const [middle_x_coordinates, setMiddle_x_coordinates] = useState([0, 0]);
  const [ring_x_coordinates, setRing_x_coordinates] = useState([0, 0]);
  const [pinky_x_coordinates, setPinky_x_coordinates] = useState([0, 0]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [prevFingerCoordinates, setPrevFingerCoordinates] = useState<string[]>(
    Array(21).fill("")
  );
  const [fingerConversionArray, setFingerConversionArray] = useState<number[]>(
    Array(5).fill(0)
  );
  const [tallyResults, setTallyResults] = useState<string[]>([]);
  const [showCanvas, setShowCanvas] = useState(true);

  const clearResults = () => {
    setTallyResults([]);
  };

  useEffect(() => {
    const runHandpose = async () => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current!;
      const canvas = canvasRef.current!;
      const net = await handpose.load();

      // Get video stream
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        video.srcObject = stream;
      } catch (error) {
        console.error("Error accessing camera:", error);
        return;
      }

      // Character data mapping
      const characterData: Record<string, string> = {
        "00000": "",
        "00001": "A",
        "00010": "B",
        "00011": "C",
        "00100": "D",
        "00101": "E",
        "00110": "F",
        "00111": "G",
        "01000": "H",
        "01001": "I",
        "01010": "J",
        "01011": "K",
        "01100": "L",
        "01101": "M",
        "01110": "N",
        "01111": "O",
        "10000": "P",
        "10001": "Q",
        "10010": "R",
        "10011": "S",
        "10100": "T",
        "10101": "U",
        "10110": "V",
        "10111": "W",
        "11000": "X",
        "11001": "Y",
        "11010": "Z",
        "11111": " ",
      };

      // Detect hand in each frame
      const detectHand = async () => {
        const predictions = (await net.estimateHands(video)) || [];

        // Draw mesh lines on canvas
        if (predictions.length > 0) {
          const fingerCoordinates = predictions[0].landmarks.map(
            (coords: [number, number, number]) =>
              coords.map((coord) => coord.toFixed(2))
          );

          const newThumbXCoordinates = [
            Number(fingerCoordinates[1][0]), // Thumb point 1
            Number(fingerCoordinates[2][0]), // Thumb point 2
          ];

          const newIndexXCoordinates = [
            Number(fingerCoordinates[5][0]), // Index point 1
            Number(fingerCoordinates[6][0]), // Index point 2
          ];

          const newMiddleXCoordinates = [
            Number(fingerCoordinates[9][0]), // Middle point 1
            Number(fingerCoordinates[10][0]), // Middle point 2
          ];

          const newRingXCoordinates = [
            Number(fingerCoordinates[13][0]), // Ring point 1
            Number(fingerCoordinates[14][0]), // Ring point 2
          ];

          const newPinkyXCoordinates = [
            Number(fingerCoordinates[17][0]), // Pinky point 1
            Number(fingerCoordinates[18][0]), // Pinky point 2
          ];

          // Compare with previous coordinates and log if different
          if (!arraysEqual(newThumbXCoordinates, thumb_x_coordinates)) {
            console.log("Thumb's X Coordinates changed:", newThumbXCoordinates);
            setThumb_x_coordinates(newThumbXCoordinates);
          }

          if (!arraysEqual(newIndexXCoordinates, index_x_coordinates)) {
            console.log("Index's X Coordinates changed:", newIndexXCoordinates);
            setIndex_x_coordinates(newIndexXCoordinates);
          }

          if (!arraysEqual(newMiddleXCoordinates, middle_x_coordinates)) {
            console.log(
              "Middle's X Coordinates changed:",
              newMiddleXCoordinates
            );
            setMiddle_x_coordinates(newMiddleXCoordinates);
          }

          if (!arraysEqual(newRingXCoordinates, ring_x_coordinates)) {
            console.log("Ring's X Coordinates changed:", newRingXCoordinates);
            setRing_x_coordinates(newRingXCoordinates);
          }

          if (!arraysEqual(newPinkyXCoordinates, pinky_x_coordinates)) {
            console.log("Pinky's X Coordinates changed:", newPinkyXCoordinates);
            setPinky_x_coordinates(newPinkyXCoordinates);
          }

          // Update fingerConversionArray
          const newConversionArray = [
            newThumbXCoordinates[0] > newThumbXCoordinates[1] ? 0 : 1,
            newIndexXCoordinates[0] > newIndexXCoordinates[1] ? 0 : 1,
            newMiddleXCoordinates[0] > newMiddleXCoordinates[1] ? 0 : 1,
            newRingXCoordinates[0] > newRingXCoordinates[1] ? 1 : 0,
            newPinkyXCoordinates[0] > newPinkyXCoordinates[1] ? 1 : 0,
          ];

          if (!arraysEqual(newConversionArray, fingerConversionArray)) {
            console.log("Finger Conversion Array changed:", newConversionArray);
            setFingerConversionArray(newConversionArray);

            // Tally the conversion array and compare
            const tallyResult = tallyAndCompare(newConversionArray);
            console.log("Tally Result:", tallyResult);

            // Update tallyResults based on your intended logic
            if (tallyResult !== "No match") {
              setTallyResults((prevResults) => [...prevResults, tallyResult]);
            }
          }

          logFingerCoordinates("Thumb", fingerCoordinates.slice(1, 5));
          logFingerCoordinates("Index", fingerCoordinates.slice(5, 9));
          logFingerCoordinates("Middle", fingerCoordinates.slice(9, 13));
          logFingerCoordinates("Ring", fingerCoordinates.slice(13, 17));
          logFingerCoordinates("Pinky", fingerCoordinates.slice(17, 21));

          // Log if there is a change in coordinates
          if (
            !prevFingerCoordinates.every(
              (prevCoord, index) =>
                prevCoord === fingerCoordinates[index].join(",")
            )
          ) {
            console.log("Coordinates changed!");
            setPrevFingerCoordinates(
              fingerCoordinates.map((coords) => coords.join(","))
            );
          }

          const context = canvas.getContext("2d");
          if (context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            predictions.forEach((hand) => {
              hand.landmarks.forEach((point) => {
                const [x, y] = point;
                context.beginPath();
                context.arc(x, y, 5, 0, 2 * Math.PI);
                context.fillStyle = "red";
                context.fill();
              });

              // Connect landmarks with lines to form the hand mesh within bounding box
              context.beginPath();
              context.moveTo(hand.landmarks[0][0], hand.landmarks[0][1]);
              for (let i = 1; i < hand.landmarks.length; i++) {
                const [x, y] = hand.landmarks[i];
                context.lineTo(x, y);
              }
              context.lineWidth = 3;
              context.strokeStyle = "blue";
              context.stroke();

              // Draw a line specifically for the thumb finger to avoid distortion
              const thumbBaseX = hand.landmarks[0][0];
              const thumbTipX = hand.landmarks[4][0];
              const thumbMidX = hand.landmarks[2][0];

              const thumbBaseY = hand.landmarks[0][1];
              const thumbTipY = hand.landmarks[4][1];
              const thumbMidY = hand.landmarks[2][1];

              // Draw line from thumb base to midpoint to avoid distortion
              context.beginPath();
              context.moveTo(thumbBaseX, thumbBaseY);
              context.lineTo(thumbMidX, thumbMidY);
              context.lineWidth = 3;
              context.strokeStyle = "blue";
              context.stroke();
            });
          }
        }

        requestAnimationFrame(detectHand);
      };

      const arraysEqual = (arr1: number[], arr2: number[]) => {
        return (
          arr1.length === arr2.length &&
          arr1.every((value, index) => value === arr2[index])
        );
      };

      const tallyAndCompare = (newConversionArray: number[]) => {
        // Tally the conversion array
        // Convert array to string
        const tallyResult = newConversionArray.join("");

        // Compare with character data
        console.log("Tally result to string", tallyResult);
        const charResult = characterData[tallyResult.toString()];

        return charResult || "No match";
      };

      const logFingerCoordinates = (
        fingerName: string,
        coordinates: string[][]
      ) => {
        console.log(`${fingerName} Finger Coordinates:`);
        coordinates.forEach((coord, index) => {
          console.log(`  Point ${index + 1}: ${coord.join(", ")}`);
        });
      };

      video.addEventListener("loadeddata", () => {
        detectHand();
      });
    };

    runHandpose();
  }, [
    prevFingerCoordinates,
    thumb_x_coordinates,
    index_x_coordinates,
    middle_x_coordinates,
    ring_x_coordinates,
    pinky_x_coordinates,
    fingerConversionArray,
    tallyResults,
    showCanvas,
  ]);

  return (
    <div className="flex flex-col items-center min-h-screen bg-black text-white py-8 relative">
      <div className="relative">
        <video
          ref={videoRef}
          width={640}
          height={480}
          autoPlay
          className="rounded-md shadow-md"
        ></video>
        <button
          onClick={clearResults}
          className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-md"
        >
          Clear
        </button>
        {/* Checkbox to toggle canvas visibility */}
        <label className="absolute top-2 right-2 text-white">
          <input
            type="checkbox"
            checked={showCanvas}
            onChange={() => setShowCanvas(!showCanvas)}
          />
          <span className="ml-2">Show Canvas</span>
        </label>
        {showCanvas && (
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="absolute rounded-md shadow-md"
          ></canvas>
        )}
      </div>
      {tallyResults.length > 0 && (
        <div className="mt-4 text-2xl font-bold">
          Results:{" "}
          {tallyResults.map((result, index) => (
            <span key={index}>{result}</span>
          ))}
        </div>
      )}
    </div>
  );
};

export default HandMesh;
