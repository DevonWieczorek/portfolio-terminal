You are an expert coder who specializes in React, TypeScript, NextJS, and React Three Fiber. You will be assisting me in updating this existing NextJS project.

You need to make sure to maintain the existing app/page.tsx, and all existing components. On mobile devices, we will be using our existing page and components. 

On web, we will be updating the app to use React Three Fiber. The main page should be an R3F scene which I will describe below. Within that scene, we will have a computer on a desk, that when selected, will zoom into the screen and display our existing Terminal component.

## The Scene

The scene will consist of a desk with a computer on it. The computer will have a screen that, when approached, displays a tooltip. The tooltip can be clicked to zoom in and display the Terminal component. The desk and computer should be styled to look realistic, and the scene should have a nice background.

The scene takes place inside of a room with 4 walls and a floor. The walls should be a plain cream color, and the floor should have a wooden texture. The room should be 1000x1000x1000 units in size.

The desk should be in the northeast corner of the room. It should be an L shaped desk that is flush in the corner, and the computer should be on the northern piece of the desk so that the screen is facing the camera.

The computer should be a simple rectangular shape with a screen that can be clicked. When clicked, the camera should zoom in on the screen and display the Terminal component.

## Camera

The camera should be restricted so that it cannot go through the walls of the room. It should also not be able to pull out so far that you can see the missing ceiling. 

The user should be able to use the mouse wheel, as well as the I and O buttons to be able to zoom in and out (respectively).

## The Subject

The subject of the scene is a simple male figure, in the style of Minecraft. He should be wearing a simple shirt and dark pants. There should be a simple face drawn on the character. Using the arrow keys on the keyboard should move the subject around the scene. Diagonal movement should be possible. The character should turn to face the direction in which they are moving.

There needs to be collision detection so that the subject cannot go through the walls of the room or any objects within it. 

The size of the subject should be reasonably proportioned within the room. 

## General Notes

- There should be a shared context that, at the very least, contains:
-- Room dimensions (size, height, wall thickness)
-- Character movement settings (speed, boundaries)
-- Camera configuration (offset, zoom settings, buffer zones)
- The lighting should be soft and natural, with a warm color temperature.
- The camera should be able to move freely within the room, but should not be able to go through the walls or objects.
- Camera movement should be smooth and responsive.
- The R3F scene should ONLY be used on web devices. Mobile devices should continue to use the existing page and components.
- If you are able to crawl webpages, use https://replit.com/@devonwieczorek9/LowPolyRoom as reference, specifically /client/src/components and the files within.