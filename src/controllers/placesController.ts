import { Handler } from "express";
import { validationResult } from "express-validator/src/validation-result";
import { Types } from "mongoose";

import HttpError from "../models/httpError";
import { getCordsForAddress } from "../utils/location";
import Place from "../models/placeModel";

interface Place {
  id: string;
  creator: string;
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  title: string;
  address: string;
}

const DUMMMY_PLACES: Place[] = [];

export const getPlaceById: Handler = async (req, res, next) => {
  const { placeId } = req.params;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not find a place.", 500)
    );
  }

  if (!place)
    return next(
      new HttpError("Could not find a place for the provided ID.", 404)
    );

  res.json({ place: place.toObject({ getters: true }) });
};

export const getPlacesByUserId: Handler = async (req, res, next) => {
  const { userId } = req.params;

  let places;
  try {
    places = await Place.find({ creator: userId });
  } catch (err) {
    return next(
      new HttpError("Fetching places failed, please try again later.", 500)
    );
  }

  if (!places.length)
    return next(
      new HttpError("Could not find any places for the provided user ID.", 404)
    );

  res.json({
    places: places.map((place) => place.toObject({ getters: true })),
  });
};

export const createPlace: Handler = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );

  const { title, description, address, creator } = req.body;
  let coordinates;
  try {
    const data: any = await getCordsForAddress(address);
    coordinates = {
      lat: +data.latt,
      lng: +data.longt,
    };
  } catch (err) {
    return next(err);
  }

  const createdPlace = new Place({
    title,
    description,
    image: "DummyURL",
    address,
    location: coordinates,
    creator,
  });

  try {
    await createdPlace.save();
  } catch (err) {
    return next(
      new HttpError("Creating place failed, please try again later.", 500)
    );
  }

  res.status(201).json({ place: createdPlace });
};

export const updatePlace: Handler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );

  const { title, description } = req.body;
  const { placeId } = req.params;

  const updatedPlace = {
    ...DUMMMY_PLACES.find((place) => place.id === placeId),
  };
  const placeIndex = DUMMMY_PLACES.findIndex((place) => place.id === placeId);

  if (updatedPlace) {
    updatedPlace.title = title;
    updatedPlace.description = description;
    DUMMMY_PLACES[placeIndex] = updatedPlace as Place;
  }

  res.status(200).json({ place: updatedPlace });
};

export const deletePlace: Handler = (req, res, next) => {
  const { placeId } = req.params;
  const place = DUMMMY_PLACES.find((place) => place.id === placeId);
  if (!place)
    return next(new HttpError("Could not find a place for that ID.", 404));

  const placeIndex = DUMMMY_PLACES.findIndex((place) => place.id === placeId);
  DUMMMY_PLACES.splice(placeIndex, 1);

  res.status(200).json({ message: "Deleted place successfully." });
};
