import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
  ForbiddenException,
  NotFoundException,
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
import { BookingsService } from "../bookings/bookings.service";
import { PaymentsService } from "./payments.service";
import { CreatePaymentSessionDto } from "./dto/create-payment-session.dto";
import { GuestPaymentSessionDto } from "./dto/guest-payment-session.dto";
import { PayOsWebhookDto } from "./dto/payos-webhook.dto";

interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

@ApiTags("Payments")
@Controller("payments")
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly bookingsService: BookingsService,
  ) {}

  @Post("session")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a PayOS payment session" })
  async createSession(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreatePaymentSessionDto,
  ) {
    const booking = await this.bookingsService.findByReference(
      dto.bookingReference,
    );
    if (!booking) {
      throw new NotFoundException({
        code: "PAYMENT_007",
        message: "Booking not found",
      });
    }
    if (booking.userId && booking.userId !== req.user?.userId) {
      throw new ForbiddenException({
        code: "PAYMENT_008",
        message: "You cannot pay for this booking",
      });
    }

    const session = await this.paymentsService.createPayOsSession(dto);
    return {
      success: true,
      data: session,
    };
  }

  @Post("session/guest")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create payment session for guest booking" })
  async createGuestSession(@Body() dto: GuestPaymentSessionDto) {
    await this.bookingsService.lookupForGuest(
      dto.bookingReference,
      dto.contact,
    );
    const session = await this.paymentsService.createPayOsSession(dto);
    return {
      success: true,
      data: session,
    };
  }

  @Get(":paymentId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get payment status" })
  @ApiResponse({ status: 200, description: "Payment status returned" })
  async getPaymentStatus(@Param("paymentId") paymentId: string) {
    const summary = await this.paymentsService.getPaymentSummary(paymentId);
    return {
      success: true,
      data: summary,
    };
  }

  @Post("payos/webhook")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "PayOS webhook endpoint" })
  async handleWebhook(@Body() dto: PayOsWebhookDto) {
    return this.paymentsService.handlePayOsWebhook(dto);
  }
}
