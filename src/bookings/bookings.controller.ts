import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { TokenPayload } from "../auth/interfaces/user.interface";
import { BookingsService } from "./bookings.service";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { SeatLocksService } from "./seat-locks.service";
import { SeatAvailabilityQueryDto } from "./dto/seat-availability-query.dto";
import { GuestBookingLookupDto } from "./dto/guest-booking-lookup.dto";
import { ContactVerificationDto } from "./dto/contact-verification.dto";

interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

@ApiTags("Bookings")
@Controller("bookings")
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly seatLocksService: SeatLocksService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new booking" })
  @ApiResponse({ status: 201, description: "Booking created" })
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateBookingDto,
  ) {
    const userId = req.user?.userId ?? null;
    const booking = await this.bookingsService.create(userId, dto);
    return {
      success: true,
      data: {
        bookingReference: booking.bookingReference,
        total: booking.total,
        currency: booking.currency,
        status: booking.status,
        expiresAt: booking.expiresAt,
      },
    };
  }

  @Post("guest")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new guest booking" })
  @ApiResponse({ status: 201, description: "Guest booking created" })
  async createGuest(@Body() dto: CreateBookingDto) {
    const booking = await this.bookingsService.create(null, dto);
    return {
      success: true,
      data: {
        bookingReference: booking.bookingReference,
        total: booking.total,
        currency: booking.currency,
        status: booking.status,
        expiresAt: booking.expiresAt,
      },
    };
  }

  @Post("lookup")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Lookup a booking by reference and contact info" })
  @ApiResponse({ status: 200, description: "Booking returned" })
  async lookup(@Body() dto: GuestBookingLookupDto) {
    const booking = await this.bookingsService.lookupForGuest(
      dto.bookingReference,
      dto.contact,
    );
    return {
      success: true,
      data: booking,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "List bookings for current user" })
  @ApiResponse({ status: 200, description: "Bookings returned" })
  async list(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    if (!userId) {
      return { success: true, data: [] };
    }
    const bookings = await this.bookingsService.listForUser(userId);
    return {
      success: true,
      data: bookings,
    };
  }

  @Get("availability")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get seat availability for a trip" })
  @ApiResponse({ status: 200, description: "Seat availability returned" })
  async availability(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: SeatAvailabilityQueryDto,
  ) {
    if (!query.route || !query.travelDate) {
      throw new BadRequestException({
        code: "SEAT_LOCK_000",
        message: "route and travelDate are required",
      });
    }
    const snapshot = await this.seatLocksService.getAvailability(query);
    return {
      success: true,
      data: snapshot,
    };
  }

  @Get(":reference")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get booking details by reference" })
  @ApiResponse({ status: 200, description: "Booking returned" })
  async getOne(
    @Req() req: AuthenticatedRequest,
    @Param("reference") reference: string,
  ) {
    const booking = await this.bookingsService.findByReference(reference);
    if (!booking) {
      throw new NotFoundException({
        code: "BOOKING_001",
        message: "Booking not found",
      });
    }
    const userId = req.user?.userId;
    if (booking.userId && userId && booking.userId !== userId) {
      throw new ForbiddenException({
        code: "BOOKING_002",
        message: "You do not have access to this booking",
      });
    }
    return {
      success: true,
      data: booking,
    };
  }

  @Patch(":reference/cancel")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cancel a booking" })
  @ApiResponse({ status: 200, description: "Booking cancelled" })
  async cancel(
    @Req() req: AuthenticatedRequest,
    @Param("reference") reference: string,
  ) {
    const booking = await this.bookingsService.findByReference(reference);
    if (!booking) {
      throw new NotFoundException({
        code: "BOOKING_001",
        message: "Booking not found",
      });
    }
    const userId = req.user?.userId;
    if (booking.userId && userId && booking.userId !== userId) {
      throw new ForbiddenException({
        code: "BOOKING_002",
        message: "You do not have access to this booking",
      });
    }
    const updated = await this.bookingsService.cancel(reference);
    return {
      success: true,
      data: updated,
    };
  }

  @Patch(":reference/confirm")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Confirm a pending booking" })
  @ApiResponse({ status: 200, description: "Booking confirmed" })
  async confirm(
    @Req() req: AuthenticatedRequest,
    @Param("reference") reference: string,
  ) {
    const booking = await this.bookingsService.findByReference(reference);
    if (!booking) {
      throw new NotFoundException({
        code: "BOOKING_001",
        message: "Booking not found",
      });
    }
    const userId = req.user?.userId;
    if (booking.userId && userId && booking.userId !== userId) {
      throw new ForbiddenException({
        code: "BOOKING_002",
        message: "You do not have access to this booking",
      });
    }
    const updated = await this.bookingsService.confirm(reference);
    return {
      success: true,
      data: updated,
    };
  }

  @Patch(":reference/guest-confirm")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Confirm a pending booking as a guest" })
  @ApiResponse({ status: 200, description: "Booking confirmed" })
  async confirmGuest(
    @Param("reference") reference: string,
    @Body() contact: ContactVerificationDto,
  ) {
    const booking = await this.bookingsService.confirmForGuest(
      reference,
      contact,
    );
    return {
      success: true,
      data: booking,
    };
  }
}
