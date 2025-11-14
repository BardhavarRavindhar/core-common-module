export const BookingType = Object.freeze({
    SCHEDULE: 'SCHEDULE',
    INSTANT: 'INSTANT'
});

export const BookingUser = Object.freeze({
    FIRST_TIME: 'FIRST_TIME',
    REGULAR: 'REGULAR'
});

export const BookingStatus = Object.freeze({
    PENDING: 'PENDING', 
    ACCEPTED: 'ACCEPTED', 
    CONFIRMED: 'CONFIRMED', 
    REJECTED: 'REJECTED', 
    PENDING_CANCEL: 'PENDING_CANCEL',
    CANCELLED: 'CANCELLED'
});

export const BookingExpertStatus = Object.freeze({
    PENDING: 'PENDING', 
    ACCEPTED: 'ACCEPTED', 
    REJECTED: 'REJECTED'
});

export const BookingSessionType = Object.freeze({
    AUDIO: 'AUDIO',
    VIDEO: 'VIDEO',
    MESSAGE: 'MESSAGE'
})